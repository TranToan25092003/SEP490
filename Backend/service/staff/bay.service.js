const { Bay, ServiceOrderTask } = require("../../model");

const DEFAULT_LOOKAHEAD_HOURS = 8;
const DEFAULT_UPCOMING_LIMIT = 5;

const toISO = (value) => (value ? new Date(value).toISOString() : null);

class BayService {
  async listBays(query = {}) {
    const { page = 1, limit = 10, search = "", status } = query;
    const filter = {};
    if (search) {
      filter.$or = [
        { bay_number: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (status) filter.status = status;

    const bays = await Bay.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    const total = await Bay.countDocuments(filter);
    return {
      bays,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  async createBay(payload) {
    const { bay_number, status = "available", description } = payload;
    if (!bay_number) throw new Error("bay_number is required");
    return await Bay.create({ bay_number, status, description });
  }

  async updateBay(id, payload) {
    const bay = await Bay.findByIdAndUpdate(id, payload, { new: true });
    if (!bay) throw new Error("Bay not found");
    return bay;
  }

  async deleteBay(id) {
    const bay = await Bay.findByIdAndDelete(id);
    if (!bay) throw new Error("Bay not found");
    return true;
  }

  async getAvailability(query = {}) {
    const now = new Date();
    const lookaheadHours =
      Number(query.lookaheadHours) > 0
        ? Number(query.lookaheadHours)
        : DEFAULT_LOOKAHEAD_HOURS;
    const limitUpcoming =
      Number(query.limitUpcoming) > 0
        ? Number(query.limitUpcoming)
        : DEFAULT_UPCOMING_LIMIT;

    const from = query.from ? new Date(query.from) : now;
    const to = query.to
      ? new Date(query.to)
      : new Date(from.getTime() + lookaheadHours * 60 * 60 * 1000);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new Error("Invalid date range supplied");
    }
    if (to <= from) {
      throw new Error("`to` must be greater than `from`");
    }

    const bays = await Bay.find({}).lean();
    if (bays.length === 0) {
      return {
        now: now.toISOString(),
        from: from.toISOString(),
        to: to.toISOString(),
        bays: [],
      };
    }

    const bayIds = bays.map((bay) => bay._id);

    const tasks = await ServiceOrderTask.find({
      assigned_bay_id: { $in: bayIds },
      status: { $ne: "completed" },
      $or: [
        // Các task theo lịch (scheduled) nằm trong khoảng thời gian đang xem
        {
          expected_end_time: { $gte: from },
          expected_start_time: { $lte: to },
        },
        // Các task đang thực tế sửa (in_progress) luôn phải lấy,
        // kể cả khi lịch dự kiến nằm ngoài khoảng from/to
        {
          status: "in_progress",
        },
      ],
    })
      .populate("service_order_id", "orderNumber status")
      .sort({ expected_start_time: 1 })
      .lean();

    const tasksByBay = tasks.reduce((acc, task) => {
      const key = task.assigned_bay_id.toString();
      if (!acc.has(key)) {
        acc.set(key, []);
      }
      acc.get(key).push(task);
      return acc;
    }, new Map());

    const baySnapshots = bays.map((bay) => {
      const bayTasks = tasksByBay.get(bay._id.toString()) || [];
      const currentTask = bayTasks.find((task) => {
        const startTime = new Date(
          task.actual_start_time || task.expected_start_time
        );
        const endTime = new Date(
          task.actual_end_time || task.expected_end_time
        );
        return startTime <= now && endTime >= now;
      });

      const upcomingTasks = bayTasks
        .filter((task) => {
          const startTime = new Date(
            task.actual_start_time || task.expected_start_time
          );
          return startTime > now;
        })
        .slice(0, limitUpcoming)
        .map((task) => ({
          taskId: task._id.toString(),
          serviceOrderId: task.service_order_id?._id?.toString() || null,
          orderNumber: task.service_order_id?.orderNumber || null,
          status: task.status,
          start: toISO(task.actual_start_time || task.expected_start_time),
          end: toISO(task.actual_end_time || task.expected_end_time),
        }));

      const availabilityStatus =
        bay.status === "inactive"
          ? "inactive"
          : currentTask
          ? "occupied"
          : "available";

      return {
        id: bay._id.toString(),
        bayNumber: bay.bay_number,
        description: bay.description,
        baseStatus: bay.status,
        availabilityStatus,
        isFreeNow: availabilityStatus === "available",
        currentTask: currentTask
          ? {
              taskId: currentTask._id.toString(),
              serviceOrderId:
                currentTask.service_order_id?._id?.toString() || null,
              orderNumber: currentTask.service_order_id?.orderNumber || null,
              status: currentTask.status,
              start: toISO(
                currentTask.actual_start_time || currentTask.expected_start_time
              ),
              end: toISO(
                currentTask.actual_end_time || currentTask.expected_end_time
              ),
            }
          : null,
        upcomingTasks,
        nextAvailableAt:
          availabilityStatus === "inactive"
            ? null
            : currentTask
            ? toISO(
                currentTask.actual_end_time || currentTask.expected_end_time
              )
            : toISO(now),
      };
    });

    return {
      now: toISO(now),
      from: toISO(from),
      to: toISO(to),
      bays: baySnapshots,
    };
  }
}

module.exports = new BayService();
