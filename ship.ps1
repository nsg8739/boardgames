# ship.ps1 — 변경을 GitHub에 커밋·푸시한 뒤 Netlify 운영 배포까지 한 번에.
# 사용법:  .\ship.ps1 "커밋 메시지"
#
# 동작 순서: git add → (변경 있으면) commit & push → netlify 배포
# 변경 사항이 없으면 커밋을 건너뛰고 배포만 진행한다(빈 커밋 에러로 멈추지 않게).

param([Parameter(Mandatory = $true)][string]$Message)

$ErrorActionPreference = "Stop"   # 어느 단계든 실패하면 즉시 중단

git add -A

# git add 후 스테이징된 변경이 있는지 확인. 출력이 비어 있으면 변경 없음.
if (git status --porcelain) {
    git commit -m $Message
    git push
} else {
    Write-Host "변경 사항 없음 — 커밋/푸시 건너뜀, 배포만 진행합니다." -ForegroundColor Yellow
}

netlify deploy --prod --dir .
