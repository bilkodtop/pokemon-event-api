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


let veriler = require("./db.json");


app.get("/kaydet", (req, res) => {
    try {
      const kullaniciAdi = req.query.kullanici_adi;
      const ogrenciNo = req.query.ogrenci_no;
  
      // Kullanıcı adının benzersiz olup olmadığını kontrol et
      const kullaniciVarMi = veriler.kullanicilar.some(
        (kullanici) => kullanici.nickname === kullaniciAdi
      );
  
      if (kullaniciVarMi) {
        // Kullanıcı adı zaten alınmışsa 409 Conflict yanıtını gönder
        res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor." });
      } else {
        const yeniKullanici = {
          nickname: kullaniciAdi,
          ogrenciNo: ogrenciNo,
          yakalananPokemonlar: [],
        };
  
        veriler.kullanicilar.push(yeniKullanici);
  
        fs.writeFileSync("db.json", JSON.stringify(veriler, null, 4));
  
        res.json({ message: "Kaydınız başarıyla tamamlandı!" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
 
  app.get('/pokemon-ekle', (req, res) => {
    const ogrenciNo = req.query.ogrenciNo;
    const yeniPokemon = req.query.yeniPokemon;

    // Öğrenci numarasına göre kullanıcıyı bul
    const kullanici = veriler.kullanicilar.find((kullanici) => {
        return kullanici.ogrenciNo === ogrenciNo;
    });

    // Kullanıcı bulunamazsa hata mesajı döndür
    if (!kullanici) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    // Yeni Pokémon'i kullanıcının listesine ekle
    if (!kullanici.yakalananPokemonlar.includes(yeniPokemon)) {
        kullanici.yakalananPokemonlar.push(yeniPokemon);}

    // Kullanıcıyı db.json dosyasına kaydet
    fs.writeFileSync("db.json", JSON.stringify(veriler, null, 4));

    // Başarı mesajı döndür
    res.json({ message: yeniPokemon + " başarıyla yakalandı." });
});

app.get("/en-yuksek-yakalama-oranlari", (req, res) => {
  // Kullanıcıları Pokemon yakalama oranına göre sırala
  const siraliKullanicilar = veriler.kullanicilar.sort((a, b) => {
    return b.yakalananPokemonlar.length - a.yakalananPokemonlar.length;
  });

  // En yüksek 3 yakalama oranına sahip kullanıcıları seç
  const enYuksekOranlar = siraliKullanicilar.slice(0, 3);

  res.json(enYuksekOranlar);
});



app.get("/giris", (req, res) => {
    const ogrenciNo = req.query.ogrenciNo;
    const kullanici = veriler.kullanicilar.find((kullanici) => kullanici.ogrenciNo === ogrenciNo);
    if (kullanici) {
      res.status(200).json({ message: "Giriş başarılı" });
    } else {
      res.status(401).json({ message: "Bu öğrenci numarası kayıtlı değil" });
    }
  });

app.listen(process.env.PORT || port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor.`);
});
