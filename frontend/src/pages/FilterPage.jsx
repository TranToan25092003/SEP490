import React, { useEffect, useState } from "react";
import {
  Layout,
  Row,
  Col,
  Typography,
  Input,
  Button,
  DatePicker,
  Form,
  Select,
} from "antd";
import { useSearchParams, useLoaderData } from "react-router-dom";
import ProductList from "@/components/item/item-list";
import { getFilteredItems } from "@/API/duc.api/item.api";
import { message } from "antd";
import dayjs from "dayjs";
import { getAllCategoriesWithStats } from "@/API/duc.api/category.api";
import { getAllTypes } from "@/API/duc.api/type.api";
import { getAllStatuses } from "@/API/duc.api/status.api";

const { Content } = Layout;
const { Title } = Typography;
const { RangePicker } = DatePicker;

export const filterPageLoader = async () => {
  try {
    const [typesRes, categoriesRes, statusesRes] = await Promise.all([
      getAllTypes(),
      getAllCategoriesWithStats(),
      getAllStatuses(),
    ]);

    return {
      types: typesRes || [],
      categories: categoriesRes.data || [],
      statuses: statusesRes || [],
    };
  } catch (error) {
    console.error("Error loading filter options:", error);
    return {
      types: [],
      categories: [],
      statuses: [],
    };
  }
};

const FilterPage = () => {
  const { categories, types, statuses } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("pageSize")) || 12
  );

  const typeOptions = types.map((type) => ({
    label: type.name,
    value: type._id,
  }));
  const categoryOptions = categories.map((c) => ({
    label: c.title,
    value: c._id,
  }));
  const rateOptions = [
    { label: "Hour", value: "hour" },
    { label: "Day", value: "day" },
    { label: "None", value: "no" },
  ]

  const statusOptions = statuses.map((s) => ({ label: s.name, value: s._id }));

  const fetchFilteredItems = async (filters = {}) => {
    setLoading(true);
    try {
      // Use page and pageSize from filters if provided, otherwise fall back to state
      const pageToFetch = Number(filters.page) || page;
      const pageSizeToFetch = Number(filters.pageSize) || pageSize;
      const res = await getFilteredItems({
        ...filters,
        page: pageToFetch,
        pageSize: pageSizeToFetch,
      });
      setFilteredItems(res.data || []);
      setTotalItems(res.total || 0);
    } catch (error) {
      const errors = error?.response?.data?.errors;
      if (Array.isArray(errors)) {
        const errorMessages = errors
          .map((e) => `${e.path}: ${e.msg}`)
          .join(" | ");
        message.error(errorMessages);
      } else {
        message.error("Invalid filter parameters.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onFinish = (values) => {
    const params = {};
    Object.entries(values).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "undefined"
      ) {
        if (key === "dateRange" && Array.isArray(value) && value.length === 2) {
          params.startDate = value[0]?.toISOString();
          params.endDate = value[1]?.toISOString();
        } else {
          params[key] = value;
        }
      }
    });

    params.page = 1;
    params.pageSize = pageSize;
    setPage(1);
    setSearchParams(params);
    fetchFilteredItems(params);
  };

  const handlePaginationChange = (newPage, newPageSize) => {
    const params = {};
    searchParams.forEach((value, key) => {
      if (
        value &&
        value !== "undefined" &&
        key !== "page" &&
        key !== "pageSize"
      ) {
        params[key] = value;
      }
    });
    params.page = newPage;
    params.pageSize = newPageSize;
    setPage(newPage);
    setPageSize(newPageSize);
    setSearchParams(params);
    fetchFilteredItems(params);
  };

  // Log page state changes for debugging
  useEffect(() => {
    console.log("Current page state:", page);
  }, [page]);

  useEffect(() => {
    const initialFilters = {};
    let isValid = true;

    searchParams.forEach((value, key) => {
      if (
        value === "undefined" ||
        value === null ||
        value === "" ||
        (["minPrice", "maxPrice", "ratePrice"].includes(key) &&
          isNaN(Number(value)))
      ) {
        isValid = false;
      } else {
        initialFilters[key] = value;
      }
    });

    if (!isValid) {
      console.warn("Invalid search parameters detected.");
      message.warning("One or more filter parameters are invalid.");
      setSearchParams({ page: 1, pageSize: 12 });
      setPage(1);
      setPageSize(12);
      fetchFilteredItems({ page: 1, pageSize: 12 });
      return;
    }

    const formValues = { ...initialFilters };
    if (initialFilters.startDate && initialFilters.endDate) {
      formValues.dateRange = [
        dayjs(initialFilters.startDate),
        dayjs(initialFilters.endDate),
      ];
      delete formValues.startDate;
      delete formValues.endDate;
    }

    form.setFieldsValue(formValues);
    const initialPage = Number(initialFilters.page) || 1;
    const initialPageSize = Number(initialFilters.pageSize) || 12;
    setPage(initialPage);
    setPageSize(initialPageSize);
    fetchFilteredItems({
      ...initialFilters,
      page: initialPage,
      pageSize: initialPageSize,
    });
  }, []); // Run only on mount

  return (
    <Layout style={{ backgroundColor: "#fff" }}>
      <Content style={{ padding: "0" }}>
        <Row gutter={24}>
          {/* FILTER BAR */}
          <Col
            span={6}
            style={{ borderRight: "1px #E5E5E5 solid", padding: "16px" }}
          >
            <Title level={4}>Filter Products</Title>
            <Form layout="vertical" form={form} onFinish={onFinish}>
              <Form.Item label="Search" name="search">
                <Input placeholder="Search for products, categories, description, ..." />
              </Form.Item>

              <Form.Item label="Name" name="name">
                <Input placeholder="Product name" />
              </Form.Item>

              <Form.Item label="Price Range">
                <Input.Group compact>
                  <Form.Item name="minPrice" noStyle>
                    <Input
                      style={{ width: "50%" }}
                      placeholder="Min"
                      type="number"
                    />
                  </Form.Item>
                  <Form.Item name="maxPrice" noStyle>
                    <Input
                      style={{ width: "50%" }}
                      placeholder="Max"
                      type="number"
                    />
                  </Form.Item>
                </Input.Group>
              </Form.Item>

              <Form.Item label="Rate Price" name="ratePrice">
                <Select
                  options={rateOptions}
                  placeholder="Select a rate type"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="Owner ID" name="owner">
                <Input placeholder="Owner ID" />
              </Form.Item>

              <Form.Item label="Type" name="typeId">
                <Select
                  options={typeOptions}
                  placeholder="Select a type"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="Category" name="categoryId">
                <Select
                  options={categoryOptions}
                  placeholder="Select a category"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="Status" name="statusId">
                <Select
                  options={statusOptions}
                  placeholder="Select a status"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="Post Date Range" name="dateRange">
                <RangePicker />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Apply Filters
                </Button>
              </Form.Item>
            </Form>

            <Form.Item>
              <Button
                type="primary"
                htmlType="button"
                onClick={() => {
                  form.resetFields();
                  setSearchParams({ page: 1, pageSize: 12 });
                  setPage(1);
                  setPageSize(12);
                  fetchFilteredItems({ page: 1, pageSize: 12 });
                }}
                block
              >
                Clear Filters
              </Button>
            </Form.Item>
          </Col>

          {/* PRODUCT LIST */}
          <Col span={18} style={{ padding: "16px" }}>
            <ProductList
              title="Filtered Products"
              products={filteredItems}
              loading={loading}
              total={totalItems}
              page={page}
              pageSize={pageSize}
              onPaginationChange={handlePaginationChange}
            />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default FilterPage;
