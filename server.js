const express = require("express");
const fs = require("fs");

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Herkese açık olması için '*' kullanabilirsiniz, ancak güvenlik gereksinimlerinize uygun şekilde ayarlayın.
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // İzin verilen HTTP yöntemleri
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'); // İzin verilen başlık alanları
    next();
  });
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

// Veritabanı tablosunu oluşturun (sadece ilk kez çalıştırılmalıdır)
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS kullanicilar (id INTEGER PRIMARY KEY, nickname TEXT, ogrenciNo TEXT, yakalananPokemonlar TEXT)');
});





app.get("/kaydet", (req, res) => {
    try {
      const kullaniciAdi = req.query.kullanici_adi;
      const ogrenciNo = req.query.ogrenci_no;
  
      // Kullanıcı adının benzersiz olup olmadığını kontrol et
      db.get('SELECT * FROM kullanicilar WHERE nickname = ?', [kullaniciAdi], (err, row) => {
        if (err) {
          return res.status(500).json({ message: err.message });
        }
  
        if (row) {
          // Kullanıcı adı zaten alınmışsa 409 Conflict yanıtını gönder
          return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor." });
        } else {
          // Öğrenci numarasının başkası tarafından kullanılıp kullanılmadığını kontrol et
          db.get('SELECT * FROM kullanicilar WHERE ogrenciNo = ?', [ogrenciNo], (err, row) => {
            if (err) {
              return res.status(500).json({ message: err.message });
            }
  
            if (row) {
              // Öğrenci numarası zaten alınmışsa 400 Bad Request yanıtını gönder
              return res.status(400).json({ message: "Bu öğrenci numarası zaten kullanılıyor." });
            } else {
              // Yeni kullanıcıyı veritabanına ekleyin
              db.run('INSERT INTO kullanicilar (nickname, ogrenciNo, yakalananPokemonlar) VALUES (?, ?, ?)', [kullaniciAdi, ogrenciNo, JSON.stringify([])], (err) => {
                if (err) {
                  return res.status(500).json({ message: err.message });
                }
                return res.json({ message: "Kaydınız başarıyla tamamlandı!" });
              });
            }
          });
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

 
app.get('/pokemon-ekle', (req, res) => {
  const ogrenciNo = req.query.ogrenciNo;
  const yeniPokemon = req.query.yeniPokemon;

  // Öğrenci numarasına göre kullanıcıyı bul
  db.get('SELECT * FROM kullanicilar WHERE ogrenciNo = ?', [ogrenciNo], (err, kullanici) => {
      if (err) {
          return res.status(500).json({ message: err.message });
      }

      if (!kullanici) {
          return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      // Kullanıcının yakalananPokemonlar alanını JSON'dan diziye çevirin
      const yakalananPokemonlar = JSON.parse(kullanici.yakalananPokemonlar);

      // Yeni Pokémon'i kullanıcının listesine ekleyin
      if (!yakalananPokemonlar.includes(yeniPokemon)) {
          yakalananPokemonlar.push(yeniPokemon);

          // Kullanıcının yakalananPokemonlar alanını güncelleyin
          db.run('UPDATE kullanicilar SET yakalananPokemonlar = ? WHERE ogrenciNo = ?', [JSON.stringify(yakalananPokemonlar), ogrenciNo], (err) => {
              if (err) {
                  return res.status(500).json({ message: err.message });
              }
              return res.json({ message: yeniPokemon + " başarıyla yakalandı." });
          });
      } else {
          return res.status(400).json({ message: "Bu Pokémon zaten yakalandı." });
      }
  });
});

app.get("/en-yuksek-yakalama-oranlari", (req, res) => {
  // Kullanıcıları Pokemon yakalama oranına göre sorgulayın
  db.all('SELECT * FROM kullanicilar ORDER BY length(yakalananPokemonlar) DESC LIMIT 3', [], (err, rows) => {
      if (err) {
          return res.status(500).json({ message: err.message });
      }
      return res.json(rows);
  });
});



app.get("/giris", (req, res) => {
  const ogrenciNo = req.query.ogrenci_no;
  db.get('SELECT * FROM kullanicilar WHERE ogrenciNo = ?', [ogrenciNo], (err, row) => {
      if (err) {
          return res.status(500).json({ message: err.message });
      }
      if (row) {
          res.status(200).json({ message: "Giriş başarılı" });
      } else {
          res.status(401).json({ message: "Bu öğrenci numarası kayıtlı değil" });
      }
  });
});

app.listen(process.env.PORT || port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor.`);
});
