using EcoRefund.Application.Common.Models;
using EcoRefund.Application.Features.Auth.DTOs;
using MediatR;

namespace EcoRefund.Application.Features.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(
    string AccessToken,
    string RefreshToken) : IRequest<Result<AuthResponse>>;
