# Mansis Secret Rotation Notu - 2026-06-15

## Yapılanlar

- Backend PostgreSQL parolası değiştirildi.
- Backend `.env` içinde `POSTGRES_PASSWORD` ve `DATABASE_URL` yeni parola ile güncellendi.
- `JWT_ACCESS_SECRET` ve `JWT_REFRESH_SECRET` yenilendi.
- Veritabanındaki tüm kullanıcı refresh token kayıtları sıfırlandı. Doğrulama sonucu: `0` aktif refresh token kaldı.
- Backend servisleri yeni DB/JWT ayarlarıyla yeniden oluşturuldu ve `https://backend.mansis.com.tr/application-version` 200 OK döndü.
- MinIO root parolası yenilendi; MinIO ve backend yeniden başlatıldı. Backend public sağlık kontrolü 200 OK.
- Frontend `.env.production` içinden `VITE_SENTRY_DSN` ve `VITE_SENTRY_AUTH_TOKEN` kaldırıldı.
- Admin statik bundle içindeki Sentry/ingest endpoint referansları nötralize edildi; source map dosyaları yayınlanan container’dan silindi.
- `https://admin.mansis.com.tr` ve `https://pos.mansis.com.tr` 200 OK döndü.
- Backend ve frontend Docker config dosyalarında `ghcr.io` auth kaydı doğrulandı: `0`.
- DB tarafında `SecurityAuditLog` ve desktop release write block trigger’ları aktif doğrulandı:
  - `security_audit_desktop_releases`
  - `security_audit_user`
  - `security_block_desktop_releases`

## Dış Panel Gerektirenler

Sunucudan gerçek revoke yapılamayan ve ilgili panelden yenilenmesi gereken sıradaki işler:

- GitHub/GHCR eski token revoke ve yeni deploy token üretimi.
- Firebase service account key revoke ve yeni key üretimi.
- Sentry auth token revoke. Mevcut frontend sunucusunda token kaldırıldı; kalıcı temizlik için yeni frontend build/deploy önerilir.
- PayTR merchant secret/key yenileme.
- NetGSM parola/API bilgisi yenileme.
- SMTP kullanıcı/parola yenileme.
- Adisyo entegrasyon anahtarı/parolası yenileme.

## Notlar

- Frontend sunucuda kaynak kod yok, sadece Docker image/compose var. Sentry’nin kalıcı olarak koddan çıkarılması için GitHub erişimi olan temiz bir build gerekir.
- Production source map dosyaları yayınlanan container’dan kaldırıldı; container image yeniden çekilirse bu işlem tekrar gerekir veya yeni image source map olmadan build edilmelidir.
- PostgreSQL collation version mismatch uyarısı devam ediyor; güvenlik değil bakım işi. Planlı bakımda reindex/refresh collation yapılmalı.
