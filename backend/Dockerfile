# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore — copy only csproj files first so Docker layer-caches the restore
COPY src/EcoRefund.API/EcoRefund.API.csproj           src/EcoRefund.API/
COPY src/EcoRefund.Application/EcoRefund.Application.csproj  src/EcoRefund.Application/
COPY src/EcoRefund.Domain/EcoRefund.Domain.csproj     src/EcoRefund.Domain/
COPY src/EcoRefund.Infrastructure/EcoRefund.Infrastructure.csproj src/EcoRefund.Infrastructure/
RUN dotnet restore src/EcoRefund.API/EcoRefund.API.csproj

# Copy all source and build
COPY . .
WORKDIR /src/src/EcoRefund.API
RUN dotnet publish EcoRefund.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 80

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "EcoRefund.API.dll"]
