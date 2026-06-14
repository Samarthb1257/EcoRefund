using EcoRefund.Application.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace EcoRefund.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class BaseController : ControllerBase
{
    protected IActionResult HandleResult<T>(Result<T> result)
    {
        if (result.Success)
            return Ok(new { success = true, data = result.Data, message = result.Message });

        if (result.ErrorCode == "NOT_FOUND")
            return NotFound(new { success = false, message = result.Message, errors = result.Errors });

        if (result.ErrorCode == "UNAUTHORIZED")
            return Unauthorized(new { success = false, message = result.Message });

        return BadRequest(new { success = false, message = result.Message, errors = result.Errors });
    }

    protected IActionResult HandleResult(Result result)
    {
        if (result.Success)
            return Ok(new { success = true, message = result.Message });

        return BadRequest(new { success = false, message = result.Message, errors = result.Errors });
    }
}
