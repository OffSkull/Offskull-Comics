(() => {
  "use strict";

  function client() {
    if (!window.OffSkullSupabase?.isConfigured()) {
      throw new Error("Supabase не настроен. Заполните assets/js/supabase-config.js.");
    }
    return window.OffSkullSupabase.getClient();
  }

  async function requireAdmin() {
    const db = client();
    const { data, error } = await db.auth.getSession();
    if (error) throw error;
    if (!data?.session) {
      location.replace("admin-login.html");
      return null;
    }

    const { data: isAdmin, error: roleError } = await db.rpc("is_site_admin");
    if (roleError) throw roleError;
    if (isAdmin !== true) {
      await db.auth.signOut();
      location.replace("admin-login.html");
      return null;
    }

    return data.session;
  }

  async function loadData() {
    const db = client();
    const { data, error } = await db.from("site_content").select("content").eq("id", "main").maybeSingle();
    if (error) throw error;
    if (data?.content && Number(data.content.schemaVersion || 0) >= 2) {
      return window.OffSkullData.normalize(data.content);
    }
    return window.OffSkullData.clone(window.OFFSKULL_SEED);
  }

  async function saveData(content) {
    const clean = JSON.parse(JSON.stringify(content, (key, value) => key.startsWith("__") ? undefined : value));
    clean.schemaVersion = 2;
    const db = client();
    const { error } = await db.from("site_content").upsert({
      id: "main",
      content: clean,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });
    if (error) throw error;
    return clean;
  }

  function extension(file) {
    const byType = {"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"};
    return byType[file.type] || String(file.name || "").split(".").pop().toLowerCase() || "jpg";
  }

  function slug(value) {
    return String(value || "file").toLowerCase()
      .replace(/[а-яё]/g, c => ({
        а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",
        н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",
        ы:"y",э:"e",ю:"yu",я:"ya",ь:"",ъ:""
      })[c] || c)
      .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70);
  }

  async function upload(file, folder, name) {
    if (!file || !String(file.type).startsWith("image/")) throw new Error("Выберите изображение.");
    if (file.size > 20 * 1024 * 1024) throw new Error("Файл больше 20 МБ.");

    const path = `${folder}/${slug(name)}-${Date.now()}-${Math.random().toString(36).slice(2,7)}.${extension(file)}`;
    const db = client();
    const bucket = window.OffSkullSupabase.bucket();
    const { error } = await db.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async function signOut() {
    await client().auth.signOut();
  }

  window.OffSkullAdmin = {
    requireAdmin,
    loadData,
    saveData,
    upload,
    signOut
  };
})();
