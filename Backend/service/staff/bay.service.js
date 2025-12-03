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

    // Tách riêng: 
    // 1. Lấy các task đang diễn ra tại thời điểm HIỆN TẠI (để xác định trạng thái bay)
    // 2. Lấy các task trong khoảng thời gian đang xem (để hiển thị lịch sắp tới)
    
    // Query 1: Lấy tất cả task đang diễn ra tại thời điểm hiện tại (KHÔNG phụ thuộc vào khoảng thời gian xem)
    const currentTasks = await ServiceOrderTask.find({
      assigned_bay_id: { $in: bayIds },
      status: { $ne: "completed" },
      $or: [
        // Task đang in_progress
        {
          status: "in_progress",
        },
        // Task đang diễn ra tại thời điểm hiện tại (dựa trên actual hoặc expected time)
        {
          $or: [
            {
              actual_start_time: { $exists: true, $lte: now },
              actual_end_time: { $exists: true, $gte: now },
            },
            {
              actual_start_time: { $exists: false },
              expected_start_time: { $lte: now },
              expected_end_time: { $gte: now },
            },
          ],
        },
      ],
    })
      .populate("service_order_id", "orderNumber status")
      .lean();

    // Query 2: Lấy các task trong khoảng thời gian đang xem (để hiển thị lịch sắp tới)
    const upcomingTasksQuery = await ServiceOrderTask.find({
      assigned_bay_id: { $in: bayIds },
      status: { $ne: "completed" },
      expected_end_time: { $gte: from },
      expected_start_time: { $lte: to },
    })
      .populate("service_order_id", "orderNumber status")
      .sort({ expected_start_time: 1 })
      .lean();

    // Gộp lại và loại bỏ trùng lặp (ưu tiên currentTasks)
    const currentTaskIds = new Set(currentTasks.map(t => t._id.toString()));
    const allTasks = [
      ...currentTasks,
      ...upcomingTasksQuery.filter(t => !currentTaskIds.has(t._id.toString()))
    ];

    const tasksByBay = allTasks.reduce((acc, task) => {
      const key = task.assigned_bay_id.toString();
      if (!acc.has(key)) {
        acc.set(key, []);
      }
      acc.get(key).push(task);
      return acc;
    }, new Map());

    // Tạo map các task đang diễn ra tại thời điểm hiện tại theo bay
    const currentTasksByBay = currentTasks.reduce((acc, task) => {
      const key = task.assigned_bay_id.toString();
      if (!acc.has(key)) {
        acc.set(key, []);
      }
      acc.get(key).push(task);
      return acc;
    }, new Map());

    const baySnapshots = bays.map((bay) => {
      const bayTasks = tasksByBay.get(bay._id.toString()) || [];
      // Chỉ xem xét các task đang diễn ra tại thời điểm hiện tại để xác định trạng thái bay
      const currentBayTasks = currentTasksByBay.get(bay._id.toString()) || [];
      
      // Tìm task đang diễn ra tại thời điểm hiện tại
      // Ưu tiên task có status "in_progress"
      const currentTask = currentBayTasks.find((task) => {
        // Nếu task đang in_progress, luôn coi là đang diễn ra
        if (task.status === "in_progress") {
          return true;
        }
        // Kiểm tra dựa trên thời gian thực tế hoặc dự kiến
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
