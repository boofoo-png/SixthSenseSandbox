import { vi } from "vitest";

// Pages build sample data ending "today", so fix the clock for repeatable
// tests. Only Date is faked; timers behave normally. Tests that need a
// different day call vi.setSystemTime and reset it afterwards.
vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 9, 9, 12) });
