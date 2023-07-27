
const Order = require("../models/orderModel");
const { responseError, responseSuccess } = require("../utils/responseInfo");

const DashboardController = {
  getCountTotalOrder: async (req, res) => {
    try {
      const totalOrders = await Order.aggregate([
        {
          $group: {
            _id: {
              $cond: [
                { $ne: ["$orderStatus", null] },
                "$orderStatus",
                "Tất cả",
              ],
            },
            count: { $sum: 1 },
          },
        },
      ]);

      let allTotal = 0;
      const result = {
        all: 0,
        waitingApproval: 0,
        approved: 0,
        canceled: 0,
        notApproved: 0,
      };

      totalOrders.forEach((order) => {
        if (order._id === "Tất cả") {
          result.all = order.count;
          allTotal += order.count;
        } else if (order._id === 0) {
          result.waitingApproval = order.count;
          allTotal += order.count;
        } else if (order._id === 1) {
          result.approved = order.count;
          allTotal += order.count;
        } else if (order._id === 2) {
          result.canceled = order.count;
          allTotal += order.count;
        } else if (order._id === 3) {
          result.notApproved = order.count;
          allTotal += order.count;
        }
      });

      result.all = allTotal;

      const status = {
        code: 200,
      };
      responseSuccess(res, result, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
  getChart: async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      const salesData = await Order.aggregate([
        {
          $match: {
            orderStatus: 1, // Đã duyệt, có thể điều chỉnh trạng thái tùy ý,
            createdAt: {
              $gte: fromDate
                ? new Date(fromDate)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Lọc theo ngày tạo từ ngày (hoặc 30 ngày trước nếu fromDate là null)
              $lte: toDate ? new Date(toDate) : new Date(), // Lọc theo ngày tạo đến ngày (hoặc ngày hiện tại nếu toDate là null)
            },
          },
        },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: "$createdAt" },
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            totalSales: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
            "_id.day": 1,
          },
        },
      ]);

      const data = salesData.map((item) => item.totalSales);
      const categories = salesData.map(
        (item) => `${item._id.day}/${item._id.month}/${item._id.year}`
      );
      const chart = {
        series: data,
        categories: categories,
      };

      const status = {
        code: 200,
      };
      responseSuccess(res, chart, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
  getTable: async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      const salesData = await Order.aggregate([
        {
          $match: {
            orderStatus: 1, // Đã duyệt, bạn có thể điều chỉnh trạng thái tùy ý
            createdAt: {
              $gte: fromDate
                ? new Date(fromDate)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Lọc theo ngày tạo từ ngày (hoặc 30 ngày trước nếu fromDate là null)
              $lte: toDate ? new Date(toDate) : new Date(), // Lọc theo ngày tạo đến ngày (hoặc ngày hiện tại nếu toDate là null)
            },
          },
        },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: "$createdAt" },
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: "$total_price" }, // Tổng tiền đã bán
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
            "_id.day": 1,
          },
        },
      ]);

      const dataTable = salesData.map((item) => ({
        date: `${item._id.day}/${item._id.month}/${item._id.year}`,
        totalSales: item.totalSales,
        totalRevenue: item.totalRevenue,
      }));

      const status = {
        code: 200,
      };
      responseSuccess(res, dataTable, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },

};

module.exports = DashboardController;
