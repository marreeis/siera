# =========================================================
# siera · comprimir vídeos do portfólio (precisa do ffmpeg)
#
# 1. Coloque os vídeos brutos em assets/portfolio/originais/
#    com estes nomes: leds-bahia, leds-bahia-motion, painel-led, oxe
#    (qualquer extensão: .mp4, .mov, .webm...)
# 2. Rode no PowerShell, na pasta do site:
#       powershell -ExecutionPolicy Bypass -File .\comprimir-videos.ps1
# 3. Saem prontos em assets/portfolio/<nome>.mp4 (< 10 MB) e <nome>.jpg (capa)
# =========================================================
$ErrorActionPreference = 'Stop'
$origem  = Join-Path $PSScriptRoot 'assets\portfolio\originais'
$destino = Join-Path $PSScriptRoot 'assets\portfolio'
$limiteMB = 9.5

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { throw 'ffmpeg não encontrado. Instale com: winget install Gyan.FFmpeg' }

Get-ChildItem $origem -File | Where-Object { $_.Extension -match '\.(mp4|mov|m4v|webm|mkv|avi)$' } | ForEach-Object {
    $nome  = $_.BaseName.ToLower()
    $saida = Join-Path $destino "$nome.mp4"
    $capa  = Join-Path $destino "$nome.jpg"
    Write-Host "Comprimindo $($_.Name)..."

    # vídeos verticais ficam com 720 de largura; horizontais com 1280
    $dim = (& ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 $_.FullName).Split(',')
    $escala = if ([int]$dim[1] -gt [int]$dim[0]) { "scale='min(720,iw)':-2" } else { "scale='min(1280,iw)':-2" }

    & ffmpeg -y -v error -i $_.FullName -an -vf "$escala,fps=30" -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart $saida

    $mb = (Get-Item $saida).Length / 1MB
    if ($mb -gt $limiteMB) {
        # ainda grande: recalcula a taxa de bits para caber no limite
        $dur = [double](& ffprobe -v error -show_entries format=duration -of csv=p=0 $_.FullName)
        $kbps = [math]::Floor(($limiteMB * 8192) / $dur * 0.95)
        Write-Host "  $([math]::Round($mb,1)) MB: refazendo a $kbps kbps"
        & ffmpeg -y -v error -i $_.FullName -an -vf "$escala,fps=30" -c:v libx264 -preset slow -b:v "${kbps}k" -maxrate "${kbps}k" -bufsize "$($kbps*2)k" -pix_fmt yuv420p -movflags +faststart $saida
        $mb = (Get-Item $saida).Length / 1MB
    }
    & ffmpeg -y -v error -ss 1 -i $saida -frames:v 1 -q:v 4 $capa
    Write-Host ("  pronto: {0}.mp4 ({1:N1} MB) + {0}.jpg" -f $nome, $mb)
}
