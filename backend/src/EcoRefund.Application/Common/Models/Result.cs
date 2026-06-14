namespace EcoRefund.Application.Common.Models;

public class Result<T>
{
    public bool Success { get; private set; }
    public T? Data { get; private set; }
    public string? Message { get; private set; }
    public string? ErrorCode { get; private set; }
    public List<string> Errors { get; private set; } = new();

    public static Result<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };

    public static Result<T> Fail(string message, string? errorCode = null) =>
        new() { Success = false, Message = message, ErrorCode = errorCode };

    public static Result<T> Fail(List<string> errors) =>
        new() { Success = false, Errors = errors, Message = "Validation failed." };
}

public class Result
{
    public bool Success { get; private set; }
    public string? Message { get; private set; }
    public string? ErrorCode { get; private set; }
    public List<string> Errors { get; private set; } = new();

    public static Result Ok(string? message = null) =>
        new() { Success = true, Message = message };

    public static Result Fail(string message, string? errorCode = null) =>
        new() { Success = false, Message = message, ErrorCode = errorCode };
}
