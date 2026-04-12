// @ts-check

import { request } from "../../src/common/http.js";
import { kv } from "@vercel/kv";

/**
 * Health check endpoint.
 * @type {import('express').RequestHandler}
 */
export default async (req, res) => {
  /** @type {{ status: string, timestamp: string, uptime: number, checks: Record<string, any> }} */
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {},
  };

  try {
    // Check GitHub API connectivity
    try {
      const response = await request(
        { query: "{ viewer { login } }" },
        { Authorization: `bearer ${process.env.PAT_1}` },
      );

      if (response.data?.data?.viewer?.login) {
        healthStatus.checks.githubApi = {
          status: "healthy",
          message: "GitHub API is accessible",
        };
      } else {
        throw new Error("Invalid response from GitHub API");
      }
    } catch (error) {
      healthStatus.checks.githubApi = {
        status: "unhealthy",
        message: error instanceof Error ? error.message : String(error),
      };
      healthStatus.status = "degraded";
    }

    // Check cache service (Vercel KV)
    try {
      const testKey = `health-check:${Date.now()}`;
      await kv.set(testKey, "test", { ex: 10 });
      const value = await kv.get(testKey);
      await kv.del(testKey);

      if (value === "test") {
        healthStatus.checks.cache = {
          status: "healthy",
          message: "Cache service is operational",
        };
      } else {
        throw new Error("Cache service returned unexpected value");
      }
    } catch (error) {
      healthStatus.checks.cache = {
        status: "unhealthy",
        message: error instanceof Error ? error.message : String(error),
      };
      healthStatus.status = "degraded";
    }

    // Check PAT tokens
    const patCount = Object.keys(process.env).filter((key) =>
      /^PAT_\d+$/.test(key),
    ).length;

    healthStatus.checks.tokens = {
      status: patCount > 0 ? "healthy" : "unhealthy",
      message: `${patCount} PAT token(s) configured`,
    };

    if (patCount === 0) {
      healthStatus.status = "unhealthy";
    }

    // Determine overall status
    const unhealthyChecks = Object.values(healthStatus.checks).filter(
      (check) => check && check.status === "unhealthy",
    );

    if (unhealthyChecks.length > 0) {
      healthStatus.status = "unhealthy";
    }

    // Set appropriate status code
    const statusCode =
      healthStatus.status === "healthy"
        ? 200
        : healthStatus.status === "degraded"
          ? 200
          : 503;

    return res.status(statusCode).json(healthStatus);
  } catch (error) {
    return res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
