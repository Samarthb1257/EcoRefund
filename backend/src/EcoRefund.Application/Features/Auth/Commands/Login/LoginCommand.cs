using EcoRefund.Application.Common.Models;
using EcoRefund.Application.Features.Auth.DTOs;
using EcoRefund.Domain.Enums;
using MediatR;

namespace EcoRefund.Application.Features.Auth.Commands.Login;

public record LoginCommand(
    string Email,
    string Password,
    UserRole Role) : IRequest<Result<AuthResponse>>;
