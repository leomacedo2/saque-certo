param(
    [string]$Version,
    [string]$Destination = 'C:\Users\Leonardo\Desktop\MinhaVida\VSCodeNew\SaqueCertoBackups'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $Version) {
    $packagePath = Join-Path $projectRoot 'package.json'
    if (Test-Path -LiteralPath $packagePath) {
        $Version = (Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json).version
    }
    if (-not $Version) { $Version = 'inicial' }
}
if ($Version -notmatch '^[a-zA-Z0-9][a-zA-Z0-9._-]*$') {
    throw 'Versao invalida: use letras, numeros, pontos, hifens ou sublinhados.'
}

$destinationPath = [IO.Path]::GetFullPath($Destination)
$projectPath = [IO.Path]::GetFullPath($projectRoot).TrimEnd('\')
if ($destinationPath -eq $projectPath -or $destinationPath.StartsWith($projectPath + '\', [StringComparison]::OrdinalIgnoreCase)) {
    throw 'A pasta de backups deve ficar fora do projeto.'
}
New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
$archivePath = Join-Path $destinationPath ( 'SaqueCerto-v{0}-{1}-{2}.zip' -f $Version, (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'), ([guid]::NewGuid().ToString('N').Substring(0,8)) )
$excludedDirectories = @('node_modules', '.git', '.expo', 'dist', 'build', '.gradle', 'coverage', '.cache')
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::Open($archivePath, [IO.Compression.ZipArchiveMode]::Create)
try {
    function Add-ProjectDirectory([string]$Directory) {
        foreach ($item in Get-ChildItem -LiteralPath $Directory -Force) {
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
            if ($item.PSIsContainer) {
                if ($item.Name -notin $excludedDirectories) { Add-ProjectDirectory $item.FullName }
            } else {
                $relativePath = $item.FullName.Substring($projectPath.Length + 1).Replace('\', '/')
                [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $item.FullName, $relativePath) | Out-Null
            }
        }
    }
    Add-ProjectDirectory $projectPath
} finally {
    $archive.Dispose()
}
Write-Output "Backup criado: $archivePath"
