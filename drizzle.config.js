/** @type { import("drizzle-kit").Config } */
export default {
    schema: "./utils/schema.js",
    dialect: "postgresql",
    dbCredentials: {
        url: 'postgresql://neondb_owner:npg_4U0ocCObGeMj@ep-patient-salad-a8skwnjr.eastus2.azure.neon.tech/ai-interview-mocker?sslmode=require',
    }
};