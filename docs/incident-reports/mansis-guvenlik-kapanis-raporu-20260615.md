# Mansis Guvenlik Kapanis Raporu

Tarih: 2026-06-15
Saat: 04:57 TRT civari

## Canli servis durumu

- `https://backend.mansis.com.tr/application-version`: 200 OK
- `https://admin.mansis.com.tr`: 200 OK
- `https://pos.mansis.com.tr`: 200 OK
- `https://backend.mansis.com.tr/socket.io/?EIO=4&transport=polling`: 200 OK

## Uygulanan ek onlemler

- Firebase mobil push karantinaya alindi. Backend container logu: `No Firebase credentials configured. Notification sending is DISABLED.`
- Firebase env anahtarlari backend ortaminda bos: `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_SA_POSANTO`, `FIREBASE_SA_UYANIK`.
- Backend container yeniden olusturuldu ve Firebase push devre disi durumunun calisan process'e yansidigi dogrulandi.
- POS/mobile web container yeniden olusturuldu ve artik `127.0.0.1:8082->80/tcp` olarak sadece localhost'a bagli.
- Admin container healthcheck duzeltildi ve `healthy` duruma geldi.
- POS/mobile web container healthcheck duzeltildi ve `healthy` duruma geldi.
- Backend servis portlari localhost'a bagli: `3001`, `5432`, `6379`, `9000`, `9001`, `4000`, `3100`.
- Dogrudan dis port erisimleri timeout ile kapali dogrulandi: admin `3000`, POS `8082`, backend `3001`, backend `3005`.
- Eski deploy SSH private key dosyalari `.ssh` altindan kaldirildi ve root-only emekli arsive tasindi:
  - backend: `/root/security-backups/retired-ssh-keys-20260615T015319Z`
  - admin: `/root/security-backups/retired-ssh-keys-20260615T015319Z`
- `/root/security-backups` izinleri root-only olacak sekilde sertlestirildi.
- Backend ve admin tarafinda `fail2ban`, `ssh`, `nginx`, `docker`, `mansis-firewall-hardening.service`, `mansis-ensure-services.timer` aktif dogrulandi.

## Calisma/yazdirma etkisi

- Web arayuzleri calisiyor.
- POS arayuzu calisiyor.
- Desktop yazdirma icin kullanilan backend socket endpoint'i calisiyor.
- Firebase push kapali oldugu icin mobil push bildirimi gitmez; web/POS/yazdirma akisini durdurmaz.
- JWT rotasyonu nedeniyle eski desktop oturumlari tekrar login isteyebilir.

## Kalan panel-bazli riskler

Bu maddeler sunucu icinden tamamen kapatilamaz; ilgili servis panellerinde yapilmalidir.

- GitHub/GHCR eski tokenlari revoke edilmeli.
- Firebase Console'da eski service account key'leri revoke/yenilenmeli.
- DigitalOcean activity log, cloud firewall, team/access token ve snapshot yetkileri kontrol edilmeli.
- PayTR, NetGSM, SMTP, Adisyo ve benzeri dis entegrasyon secret'lari ilgili panellerden rotate edilmeli.
- Sentry tokenlari panelden revoke edilmeli; frontend tarafindan Sentry cikartildi.

## Bakim notu

- PostgreSQL collation version warning gorunuyor. Acil guvenlik kesintisi degil; bakim penceresinde `ALTER DATABASE ... REFRESH COLLATION VERSION` ve gerekiyorsa index rebuild planlanmali.
