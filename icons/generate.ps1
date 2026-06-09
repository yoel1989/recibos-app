Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap(192, 192)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(26, 26, 46))
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(233, 69, 96))
$g.FillEllipse($brush, 16, 16, 160, 160)
$font = New-Object System.Drawing.Font("Arial", 80, [System.Drawing.FontStyle]::Bold)
$brush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString("`$", $font, $brush2, 44, 44)
$g.Dispose()
$bmp.Save("C:\Users\yoooe\AppData\Local\Temp\opencode\recibos-app\icons\icon-192.png")
$bmp.Dispose()

$bmp2 = New-Object System.Drawing.Bitmap(512, 512)
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.Clear([System.Drawing.Color]::FromArgb(26, 26, 46))
$brush3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(233, 69, 96))
$g2.FillEllipse($brush3, 40, 40, 432, 432)
$font2 = New-Object System.Drawing.Font("Arial", 220, [System.Drawing.FontStyle]::Bold)
$brush4 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g2.DrawString("`$", $font2, $brush4, 120, 110)
$g2.Dispose()
$bmp2.Save("C:\Users\yoooe\AppData\Local\Temp\opencode\recibos-app\icons\icon-512.png")
$bmp2.Dispose()

Write-Host "Icons generated!"
