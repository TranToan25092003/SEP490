const runCronTasks = async () => {
  try {
    // Task 1: Health Check
    const comp = require("../model/index");
    await comp.Test.find({});
    console.log("System is healthy 💪💪💪");
  } catch (error) {
    console.error("Error in cron tasks:", error);
    console.log("System is broken 😰😰😰");
  }
};

module.exports = { runCronTasks };
