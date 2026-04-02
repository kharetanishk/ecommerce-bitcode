import type { NextFunction, Request, Response } from "express";
import { forLogger, forLoggerFull } from "../lib/date";

// Full palette (spec): BLACK \x1b[30m, BG_RED \x1b[41m, BG_GREEN \x1b[42m,
// BG_YELLOW \x1b[43m, BG_BLUE \x1b[44m — available if you extend styling.

// ─── ANSI (no external deps) ──────────────────────────────────────────────────
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";
const WHITE = "\x1b[37m";

const BOX_INNER = 53;
const TOP = `${CYAN}┌${"─".repeat(BOX_INNER)}${RESET}`;
const BOT = `${CYAN}└${"─".repeat(BOX_INNER)}${RESET}`;
const V = `${CYAN}│${RESET}`;

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

// Use forLogger() for inline timestamps
// Use forLoggerFull() for request/response headers

function methodColor(method: string): string {
  const m = method.toUpperCase();
  if (m === "GET") return GREEN;
  if (m === "POST" || m === "PATCH") return YELLOW;
  if (m === "DELETE") return RED;
  if (m === "PUT") return CYAN;
  return WHITE;
}

function statusSymbol(status: number): { sym: string; color: string } {
  if (status >= 200 && status < 300) return { sym: "✓", color: GREEN };
  if (status >= 300 && status < 400) return { sym: "→", color: CYAN };
  if (status >= 400 && status < 500) return { sym: "⚠", color: YELLOW };
  return { sym: "✗", color: RED };
}

function durationColor(ms: number): string {
  if (ms < 100) return GREEN;
  if (ms < 500) return YELLOW;
  return RED;
}

function isEmptyBody(body: unknown): boolean {
  if (body === undefined || body === null) return true;
  if (typeof body === "object" && !Array.isArray(body) && Object.keys(body as object).length === 0)
    return true;
  return false;
}

function maskPasswordFields(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(maskPasswordFields);
  const src = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(src)) {
    if (/password/i.test(key) && typeof src[key] === "string") {
      out[key] = "***";
    } else {
      out[key] = maskPasswordFields(src[key]);
    }
  }
  return out;
}

function maskTokenFieldsDeep(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(maskTokenFieldsDeep);
  const src = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(src)) {
    const v = src[key];
    if (key === "token" && typeof v === "string") {
      out[key] = v.length <= 20 ? v : `${v.slice(0, 20)}...`;
    } else {
      out[key] = maskTokenFieldsDeep(v);
    }
  }
  return out;
}

function authHeaderForLog(req: Request): Record<string, string> | undefined {
  const raw = req.headers.authorization;
  if (!raw || typeof raw !== "string") return undefined;
  const masked = raw.length <= 20 ? raw : `${raw.slice(0, 20)}...`;
  return { authorization: masked };
}

function formatJsonBlock(value: unknown, maxDisplay = 500): string {
  try {
    const str = JSON.stringify(value, null, 0);
    if (str.length <= maxDisplay) return str;
    const truncated = str.slice(0, maxDisplay);
    return `${truncated} [truncated - ${str.length} chars total]`;
  } catch {
    return "[unserializable]";
  }
}

function extractErrorMessage(body: unknown): string {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const o = body as Record<string, unknown>;
    if (typeof o.error === "string") return o.error;
    if (typeof o.message === "string") return o.message;
  }
  return "Unknown error";
}

function line(inner: string): string {
  return `${V} ${inner}`;
}

function logIncomingRequest(req: Request): void {
  const m = req.method.toUpperCase();
  const mc = methodColor(m);
  console.log(TOP);
  console.log(line(`${BOLD}${BLUE}[API]${RESET} ${CYAN}──►${RESET} ${BOLD}INCOMING REQUEST${RESET}`));
  console.log(line(`${DIM}Method:${RESET}   ${mc}${BOLD}${m}${RESET}`));
  console.log(line(`${DIM}URL:${RESET}      ${WHITE}${req.originalUrl || req.url}${RESET}`));
  console.log(line(`${DIM}Time:${RESET}     ${forLoggerFull()}`));
  console.log(line(`${DIM}IP:${RESET}       ${req.ip ?? req.socket.remoteAddress ?? "unknown"}`));

  if (!isEmptyBody(req.body)) {
    const masked = maskPasswordFields(req.body);
    console.log(line(`${DIM}Body:${RESET}     ${WHITE}${formatJsonBlock(masked)}${RESET}`));
  }

  const headers = authHeaderForLog(req);
  if (headers) {
    console.log(line(`${DIM}Headers:${RESET}  ${WHITE}${formatJsonBlock(headers)}${RESET}`));
  }
  console.log(BOT);
}

function logResponseSent(
  req: Request,
  status: number,
  durationMs: number,
  responseBody: unknown,
): void {
  const m = req.method.toUpperCase();
  const mc = methodColor(m);
  const { sym, color: sc } = statusSymbol(status);
  const durC = durationColor(durationMs);

  console.log(TOP);
  console.log(line(`${BOLD}${BLUE}[API]${RESET} ${MAGENTA}◄──${RESET} ${BOLD}RESPONSE SENT${RESET}`));
  console.log(line(`${DIM}Method:${RESET}   ${mc}${BOLD}${m}${RESET}`));
  console.log(line(`${DIM}URL:${RESET}      ${WHITE}${req.originalUrl || req.url}${RESET}`));
  console.log(
    line(`${DIM}Status:${RESET}   ${sc}${BOLD}${status}${RESET} ${sc}${sym}${RESET}`),
  );
  console.log(
    line(`${DIM}Duration:${RESET} ${durC}${durationMs.toFixed(0)}ms${RESET}`),
  );

  if (responseBody !== undefined) {
    const masked = maskTokenFieldsDeep(responseBody);
    console.log(line(`${DIM}Body:${RESET}     ${WHITE}${formatJsonBlock(masked)}${RESET}`));
  }
  console.log(BOT);
}

function logErrorBlock(
  req: Request,
  status: number,
  durationMs: number,
  responseBody: unknown,
): void {
  const m = req.method.toUpperCase();
  const mc = methodColor(m);
  const msg = extractErrorMessage(responseBody);
  const durC = durationColor(durationMs);

  console.log(TOP);
  console.log(line(`${BOLD}${RED}[API] ✗ ERROR${RESET}`));
  console.log(line(`${DIM}Method:${RESET}   ${mc}${BOLD}${m}${RESET}`));
  console.log(line(`${DIM}URL:${RESET}      ${WHITE}${req.originalUrl || req.url}${RESET}`));
  console.log(line(`${DIM}Status:${RESET}   ${YELLOW}${status}${RESET}`));
  console.log(line(`${DIM}Error:${RESET}    ${YELLOW}${msg}${RESET}`));
  console.log(
    line(`${DIM}Duration:${RESET} ${durC}${durationMs.toFixed(0)}ms${RESET}`),
  );
  console.log(BOT);
}

function safeManualLog(fn: () => void): void {
  try {
    fn();
  } catch {
    /* never throw */
  }
}

function formatErr(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack };
  }
  if (typeof err === "string") return { message: err };
  try {
    return { message: JSON.stringify(err) };
  } catch {
    return { message: String(err) };
  }
}

export const log = {
  info(label: string, message: string, data?: unknown): void {
    if (!isDevelopment()) return;
    safeManualLog(() => {
      const t = forLogger();
      console.log(`${BLUE}[API]${RESET} ${CYAN}ℹ${RESET} ${DIM}[${label}]${RESET} ${DIM}${t}${RESET} ${message}`);
      if (data !== undefined) {
        console.log(`${DIM}  data:${RESET} ${WHITE}${formatJsonBlock(data)}${RESET}`);
      }
    });
  },

  success(label: string, message: string, data?: unknown): void {
    if (!isDevelopment()) return;
    safeManualLog(() => {
      const t = forLogger();
      console.log(
        `${BLUE}[API]${RESET} ${GREEN}✓${RESET} ${DIM}[${label}]${RESET} ${DIM}${t}${RESET} ${GREEN}${message}${RESET}`,
      );
      if (data !== undefined) {
        console.log(`${DIM}  data:${RESET} ${WHITE}${formatJsonBlock(data)}${RESET}`);
      }
    });
  },

  warn(label: string, message: string, data?: unknown): void {
    if (!isDevelopment()) return;
    safeManualLog(() => {
      const t = forLogger();
      console.log(
        `${BLUE}[API]${RESET} ${YELLOW}⚠${RESET} ${DIM}[${label}]${RESET} ${DIM}${t}${RESET} ${YELLOW}${message}${RESET}`,
      );
      if (data !== undefined) {
        console.log(`${DIM}  data:${RESET} ${WHITE}${formatJsonBlock(data)}${RESET}`);
      }
    });
  },

  error(label: string, message: string, err?: unknown): void {
    if (isDevelopment()) {
      safeManualLog(() => {
        const t = forLogger();
        const { message: em, stack } = formatErr(err);
        console.log(
          `${BLUE}[API]${RESET} ${RED}✗${RESET} ${DIM}[${label}]${RESET} ${DIM}${t}${RESET} ${RED}${message}${RESET}`,
        );
        if (err !== undefined) {
          console.log(`${DIM}  error:${RESET} ${RED}${em}${RESET}`);
          if (stack) console.log(`${DIM}  stack:${RESET} ${DIM}${stack}${RESET}`);
        }
      });
      return;
    }
    safeManualLog(() => {
      const { message: em, stack } = formatErr(err);
      console.error(`[API] [${label}] ${message}`, em);
      if (stack) console.error(stack);
    });
  },

  db(label: string, message: string, data?: unknown): void {
    if (!isDevelopment()) return;
    safeManualLog(() => {
      const t = forLogger();
      console.log(
        `${BLUE}[API]${RESET} ${MAGENTA}⬡ [DB]${RESET} ${DIM}[${label}]${RESET} ${DIM}${t}${RESET} ${message}`,
      );
      if (data !== undefined) {
        console.log(`${DIM}  data:${RESET} ${WHITE}${formatJsonBlock(data)}${RESET}`);
      }
    });
  },
};

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (!isDevelopment()) {
    next();
    return;
  }

  if (req.method === "GET" && req.path === "/api/health") {
    next();
    return;
  }

  const start = process.hrtime.bigint();
  let responseBody: unknown;

  const originalJson = res.json.bind(res);
  res.json = ((body?: unknown) => {
    responseBody = body;
    return originalJson(body);
  }) as typeof res.json;

  logIncomingRequest(req);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const status = res.statusCode;
    if (status >= 400) {
      logErrorBlock(req, status, durationMs, responseBody);
    } else {
      logResponseSent(req, status, durationMs, responseBody);
    }
    console.log("");
  });

  next();
}
