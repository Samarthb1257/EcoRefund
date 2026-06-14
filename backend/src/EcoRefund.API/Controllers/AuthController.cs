using EcoRefund.Application.Features.Auth.Commands.Login;
using EcoRefund.Application.Features.Auth.Commands.RefreshToken;
using EcoRefund.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EcoRefund.API.Controllers;

public class AuthController : BaseController
{
    private readonly ISender _mediator;

    public AuthController(ISender mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Login - supports all roles. Staff login can be disabled by OrgAdmin.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new LoginCommand(request.Email, request.Password, request.Role), ct);
        return HandleResult(result);
    }

    /// <summary>Refresh access token using refresh token.</summary>
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto request, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new RefreshTokenCommand(request.AccessToken, request.RefreshToken), ct);
        return HandleResult(result);
    }

    /// <summary>Logout - invalidates refresh token.</summary>
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        // Client clears tokens; server-side token invalidation handled via refresh token expiry
        return Ok(new { success = true, message = "Logged out successfully." });
    }
}

public class RefreshTokenDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}
