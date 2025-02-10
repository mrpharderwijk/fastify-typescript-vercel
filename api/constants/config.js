"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMITS_PER_SECOND = exports.CALL_LIMITS_PER_MONTH = void 0;
exports.CALL_LIMITS_PER_MONTH = {
    HOBBY: 1000,
    PRO: 10000,
    ENTERPRISE: 100000,
};
// Rate limits per subscription plan
exports.RATE_LIMITS_PER_SECOND = {
    HOBBY: 5,
    PRO: 10,
    ENTERPRISE: 25,
};
