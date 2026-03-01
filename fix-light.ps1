# Fix light mode: Change lime to green/emerald for light mode contexts only
# This targets the LIGHT MODE side of ternary expressions (the part after the colon)

$files = Get-ChildItem -Path "components","." -Include "*.tsx","*.ts" -File -Recurse | Where-Object { $_.FullName -notmatch "node_modules|dist|fix-light" }

foreach ($f in $files) {
    $content = [System.IO.File]::ReadAllText($f.FullName)
    $original = $content

    # Fix light mode backgrounds: lime-50 -> emerald-50 (in light mode contexts)
    $content = $content -replace "'bg-lime-50", "'bg-emerald-50"
    $content = $content -replace "'bg-lime-100", "'bg-emerald-100"

    # Fix light mode text: lime-600 -> emerald-600, lime-700 -> emerald-700, lime-800 -> emerald-800
    $content = $content -replace "text-lime-600", "text-emerald-600"
    $content = $content -replace "text-lime-700", "text-emerald-700"
    $content = $content -replace "text-lime-800", "text-emerald-800"

    # Fix light mode borders: lime-200 -> emerald-200, lime-300 -> emerald-300
    $content = $content -replace "border-lime-200", "border-emerald-200"
    $content = $content -replace "border-lime-300", "border-emerald-300"

    # Fix hover states in light mode
    $content = $content -replace "hover:bg-lime-100", "hover:bg-emerald-100"
    $content = $content -replace "hover:bg-lime-50", "hover:bg-emerald-50"
    $content = $content -replace "hover:text-lime-600", "hover:text-emerald-600"
    $content = $content -replace "hover:text-lime-700", "hover:text-emerald-700"
    $content = $content -replace "hover:text-lime-500", "hover:text-emerald-500"
    $content = $content -replace "hover:border-lime-400", "hover:border-emerald-400"
    $content = $content -replace "hover:border-lime-300", "hover:border-emerald-300"

    # Fix focus: lime -> emerald for light mode inputs
    $content = $content -replace "focus:border-lime-400", "focus:border-emerald-400"
    $content = $content -replace "focus:ring-lime-400", "focus:ring-emerald-400"

    # Fix shadow-lime in light mode
    $content = $content -replace "shadow-lime-200", "shadow-emerald-200"
    $content = $content -replace "shadow-lime-300", "shadow-emerald-300"
    $content = $content -replace "shadow-lime-600", "shadow-emerald-600"

    # Fix bg-lime-600 (used for buttons in light mode)
    $content = $content -replace "bg-lime-600", "bg-emerald-600"
    $content = $content -replace "hover:bg-lime-700", "hover:bg-emerald-700"

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($f.FullName, $content)
        Write-Output "Fixed light mode: $($f.Name)"
    }
}

Write-Output "Done!"
