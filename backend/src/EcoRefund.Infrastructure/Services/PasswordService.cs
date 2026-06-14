using EcoRefund.Application.Common.Interfaces;
using System.Text.RegularExpressions;

namespace EcoRefund.Infrastructure.Services;

public class PasswordService : IPasswordService
{
    public string HashPassword(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));

    public bool VerifyPassword(string password, string hash) =>
        BCrypt.Net.BCrypt.Verify(password, hash);

    public bool IsStrongPassword(string password)
    {
        if (password.Length < 8) return false;
        if (!Regex.IsMatch(password, @"[A-Z]")) return false;
        if (!Regex.IsMatch(password, @"[a-z]")) return false;
        if (!Regex.IsMatch(password, @"[0-9]")) return false;
        if (!Regex.IsMatch(password, @"[!@#$%^&*(),.?""':{}|<>]")) return false;
        return true;
    }
}
