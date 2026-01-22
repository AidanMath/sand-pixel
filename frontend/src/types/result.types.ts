/**
 * Result type for operations that can fail
 * Provides type-safe error handling without optional chaining
 */

/** Success result with data */
export interface SuccessResult<T> {
  success: true;
  data: T;
}

/** Failure result with error */
export interface FailureResult<E = string> {
  success: false;
  error: E;
}

/** Discriminated union result type */
export type Result<T, E = string> = SuccessResult<T> | FailureResult<E>;

/** Type guard for success result */
export function isSuccess<T, E>(result: Result<T, E>): result is SuccessResult<T> {
  return result.success === true;
}

/** Type guard for failure result */
export function isFailure<T, E>(result: Result<T, E>): result is FailureResult<E> {
  return result.success === false;
}

/** Create a success result */
export function success<T>(data: T): SuccessResult<T> {
  return { success: true, data };
}

/** Create a failure result */
export function failure<E = string>(error: E): FailureResult<E> {
  return { success: false, error };
}

/** Map over a result's success value */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (isSuccess(result)) {
    return success(fn(result.data));
  }
  return result;
}
