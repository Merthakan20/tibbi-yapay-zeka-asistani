# Arama karşılaştırma araçları

Kütüphaneye konu ekledikten veya arama kodunu değiştirdikten sonra, eski ve yeni sürümün ilk sonuçlarını karşılaştırmak için. Depo kökünden çalıştırın.

1. Değişiklikten önce yedek alın: `cp artifact/nabiz.html /tmp/nabiz-eski.html; cp kaynaklar/kaynaklar.json /tmp/kaynaklar-eski.json`
2. Değişikliği yapın (ör. `.venv/bin/python kaynaklar/ekle.py yeni.json`).
3. Karşılaştırın (yalnızca ilk sonucu değişen sorular yazılır):
   ```
   node tools/arama-karsilastir/bolge.js > /tmp/bolge.json
   for f in tools/arama-karsilastir/sorular-1.json kaynaklar/tarama-sorulari-2.json /tmp/bolge.json; do
     node tools/arama-karsilastir/karsilastir.js /tmp/nabiz-eski.html /tmp/kaynaklar-eski.json artifact/nabiz.html kaynaklar/kaynaklar.json $f
   done
   ```
4. Tek tek soru denemek: `node tools/arama-karsilastir/q.js "dişim ağrıyor" "göğsüm ve çenem ağrıyor"`
5. Kalıcı kritik kontroller: `node web/test/arama.mjs` (mutlaka geçmeli).
