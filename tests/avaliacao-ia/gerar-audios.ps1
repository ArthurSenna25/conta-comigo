# Regeneração opcional. SAPI sintetiza localmente, sem microfone nem rede.
$ErrorActionPreference = 'Stop'
$dados = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $PSScriptRoot 'casos.json') | ConvertFrom-Json
$pasta = Join-Path $PSScriptRoot 'midia'
[IO.Directory]::CreateDirectory($pasta) | Out-Null

foreach ($caso in ($dados | Where-Object modalidade -eq 'audio')) {
    $destino = Join-Path $pasta ($caso.id + '.wav')
    $fluxo = New-Object -ComObject SAPI.SpFileStream
    $fluxo.Format.Type = 18  # PCM, 16 kHz, 16 bits, mono
    $fluxo.Open($destino, 3)
    try {
        if ($caso.id -eq 'audio-06') {
            $bytes = New-Object byte[] (16000 * 2 * 2)
            $gerador = [Random]::new(24)
            for ($i = 0; $i -lt $bytes.Length; $i += 2) {
                $amostra = [BitConverter]::GetBytes([int16]$gerador.Next(-1600, 1601))
                $bytes[$i] = $amostra[0]
                $bytes[$i + 1] = $amostra[1]
            }
            $null = $fluxo.Write($bytes)
        } else {
            $nome = if ([int]$caso.id.Substring(6) % 2) { 'MariaM' } else { 'DanielM' }
            $token = New-Object -ComObject SAPI.SpObjectToken
            $token.SetId("HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens\MSTTS_V110_ptBR_$nome")
            $voz = New-Object -ComObject SAPI.SpVoice
            $voz.Voice = $token
            $voz.AudioOutputStream = $fluxo
            $null = $voz.Speak($caso.conteudo, 0)
        }
    } finally {
        $fluxo.Close()
    }
}
