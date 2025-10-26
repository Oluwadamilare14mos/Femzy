/******************************************************************
 * Firebase config (your project)
 ******************************************************************/
const firebaseConfig = {
  apiKey: "AIzaSyA2lx1hb2qZsYaXrQhsUp7hepYu5nY3fgs",
  authDomain: "damitools.firebaseapp.com",
  projectId: "damitools",
  storageBucket: "damitools.firebasestorage.app",
  messagingSenderId: "875796385681",
  appId: "1:875796385681:web:563ffc58665bdc94875430"
};

try {
  if(window.firebase && firebase.initializeApp) firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized");
} catch(e){ console.warn("Firebase init error", e); }

const auth = (window.firebase && firebase.auth) ? firebase.auth() : null;
const db = (window.firebase && firebase.firestore) ? firebase.firestore() : null;
const storage = (window.firebase && firebase.storage) ? firebase.storage() : null;

/* ===========
   App state
   =========== */
const STATE = {
  products: [],
  cart: JSON.parse(localStorage.getItem("damitools_cart")||"[]"),
  currentProduct: null,
  categories: ["All","Lighting","Switches & Sockets","Wires & Cables","Electrical Tools","DFB & Protection","Conduit & Boxes","Power & Supply","Gadgets","Solar & Outdoor","Accessories","Misc","Fans","Phones","Tablets"]
};

function saveCart(){ localStorage.setItem("damitools_cart", JSON.stringify(STATE.cart)); renderCart(); }

function toast(msg, t=1600){
  const el=document.createElement('div'); el.innerText=msg;
  Object.assign(el.style,{position:'fixed',left:'50%',transform:'translateX(-50%)',bottom:'24px',background:'rgba(0,0,0,0.8)',color:'#fff',padding:'10px 14px',borderRadius:'8px',zIndex:99999});
  document.body.appendChild(el); setTimeout(()=>el.remove(),t);
}

/* ============================
   PRODUCTS: Manual list only
   ============================ */
const PRODUCTS_BASE = [
  { id: 'p001', name: 'Single Socket', price: 2500, img: 'img/socket.jpg', cat: 'Switches & Sockets' },
  { id: 'p002', name: 'Switch', price: 1500, img: 'img/switch.jpg', cat: 'Switches & Sockets' },
  { id: 'p003', name: 'Black Tape', price: 500, img: 'img/tape.jpg', cat: 'Accessories' },
  { id: 'p004', name: '1.5mm Wire', price: 4500, img: 'img/wire.jpg', cat: 'Wires & Cables' }
];

/* ============================
   LOAD PRODUCTS
   ============================ */
// No auto generation — only manual products
STATE.products = PRODUCTS_BASE;
window.PRODUCTS = PRODUCTS_BASE;

console.log("Loaded manual products:", STATE.products.length);

/* ============================
   Render products
   ============================ */
function escapeHtml(s){ if(s==null) return ''; return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

const productGrid = document.getElementById("productGrid");
function createCard(p){
  const div = document.createElement('div'); div.className='card';
  div.innerHTML = `
    <div class="imgwrap"><img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://i.imgur.com/6VBx3io.png'"></div>
    <div class="info">
      <div class="title">${escapeHtml(p.name)}</div>
      <div class="muted">${escapeHtml(p.cat)}</div>
      <div class="price">₦${Number(p.price).toLocaleString()}</div>
      <div class="actions">
        <button type="button" class="btn" data-add="${p.id}">Add to Cart</button>
        <button type="button" class="btn-outline" data-details="${p.id}">Details</button>
      </div>
    </div>`;
  return div;
}

function renderProducts(list = STATE.products){
  if(!productGrid) return; // file not using product grid
  productGrid.innerHTML = '';
  if(!list.length){ document.getElementById('emptyState').style.display='block'; return; }
  document.getElementById('emptyState').style.display='none';
  for(const p of list) productGrid.appendChild(createCard(p));
  productGrid.querySelectorAll('[data-add]').forEach(btn=>{ btn.onclick = ()=>{ const id = +btn.dataset.add; addToCartById(id); }; });
  productGrid.querySelectorAll('[data-details]').forEach(btn=>{ btn.onclick = ()=>{ const id = +btn.dataset.details; openProductModalById(id); }; });
}

/* ============================
   Product Detail Modal
   ============================ */
const modalBackdrop = document.getElementById('modalBackdrop');
const detailMainImg = document.getElementById('detailMainImg');
const detailName = document.getElementById('detailName');
const detailCat = document.getElementById('detailCat');
const detailPrice = document.getElementById('detailPrice');
const detailDesc = document.getElementById('detailDesc');
const detailThumbs = document.getElementById('detailThumbs');
const detailAddBtn = document.getElementById('detailAddBtn');
const detailQty = document.getElementById('detailQty');
const detailAppBtn = document.getElementById('detailAppBtn');

function openProductModalById(id){
  const p = STATE.products.find(x=>x.id===id); if(!p) return;
  STATE.currentProduct = p;
  if(detailMainImg) detailMainImg.src = p.img;
  if(detailName) detailName.innerText = p.name;
  if(detailCat) detailCat.innerText = p.cat;
  if(detailPrice) detailPrice.innerText = '₦' + Number(p.price).toLocaleString();
  if(detailDesc) detailDesc.innerText = `High-quality ${p.name}. For bulk orders contact customer care.`;
  if(detailThumbs){
    detailThumbs.innerHTML = '';
    const imgs = [p.img, p.img + '&sig=1', p.img + '&sig=2'];
    imgs.forEach(src=>{
      const im = document.createElement('img'); im.src = src; im.onclick = ()=> { if(detailMainImg) detailMainImg.src = src; };
      detailThumbs.appendChild(im);
    });
  }
  if(detailQty) detailQty.value = 1;
  if(modalBackdrop) showModal(modalBackdrop);
  if(detailAddBtn) detailAddBtn.style.display = '';
}

if(document.getElementById('closeModalBtn')) document.getElementById('closeModalBtn').onclick = ()=> hideModal(modalBackdrop);
if(modalBackdrop) modalBackdrop.onclick = (e)=> { if(e.target === modalBackdrop) hideModal(modalBackdrop); };

if(detailAddBtn) detailAddBtn.onclick = ()=>{
  const q = Math.max(1, parseInt(detailQty.value||1));
  if(STATE.currentProduct) addToCartById(STATE.currentProduct.id, q);
  hideModal(modalBackdrop);
};
if(detailAppBtn) detailAppBtn.onclick = ()=> { if(STATE.currentProduct) openAppOrApk(STATE.currentProduct.id); };

/* ============================
   Cart functions
   ============================ */
function addToCartById(id, qty=1){
  const p = STATE.products.find(x=>x.id===id); if(!p) return;
  const existing = STATE.cart.find(x=>x.id===id);
  if(existing) existing.qty = Math.min(999, existing.qty + qty);
  else STATE.cart.push({...p, qty});
  saveCart(); toast(`${p.name} added to cart`);
}

function renderCart(){
  const cartCount = STATE.cart.reduce((s,i)=>s+i.qty,0);
  const cartCountEl = document.getElementById('cartCount'); if(cartCountEl) cartCountEl.innerText = cartCount;
  const mini = document.getElementById('miniCartCount'); if(mini) mini.innerText = cartCount;
  const total = STATE.cart.reduce((s,i)=>s + i.price * i.qty, 0);
  const tt = document.getElementById('cartTotal'); if(tt) tt.innerText = '₦' + total.toLocaleString();

  // If this is cart.html, render cart items list
  const cartContainer = document.getElementById('cartContainer');
  if(cartContainer){
    let html = '<div style="padding:12px;max-height:70vh;overflow:auto">';
    if(!STATE.cart.length) html += `<p class="muted-small">Cart is empty</p>`;
    for(const it of STATE.cart){
      html += `<div style="display:flex;gap:10px;padding:8px;border-bottom:1px solid rgba(0,0,0,0.04);align-items:center">
        <img src="${it.img}" style="width:72px;height:72px;object-fit:cover;border-radius:8px">
        <div style="flex:1">
          <div style="font-weight:700">${escapeHtml(it.name)}</div>
          <div class="muted-small">${escapeHtml(it.cat)}</div>
          <div style="margin-top:6px">₦${Number(it.price).toLocaleString()} × ${it.qty}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button type="button" class="iconbtn" onclick="window.__inc(${it.id})">+</button>
          <button type="button" class="iconbtn" onclick="window.__dec(${it.id})">−</button>
          <button type="button" class="iconbtn" onclick="window.__rm(${it.id})">Remove</button>
        </div>
      </div>`;
    }
    html += `<div style="margin-top:12px;text-align:right"><strong>Total:</strong> <span style="font-weight:800">₦${STATE.cart.reduce((s,i)=>s+i.price*i.qty,0).toLocaleString()}</span></div>`;
    html += `<div style="display:flex;gap:8px;margin-top:12px"><button id="checkoutCard" class="btn">Pay with Card</button><button id="checkoutBank" class="btn-outline">Pay with Bank</button><button id="checkoutCOD" class="btn-outline">Pay on Delivery</button></div>`;
    html += `</div>`;
    cartContainer.innerHTML = html;
    setTimeout(()=>{
      const cardBtn = document.getElementById('checkoutCard');
      const bankBtn = document.getElementById('checkoutBank');
      const codBtn = document.getElementById('checkoutCOD');
      if(cardBtn) cardBtn.addEventListener('click', ()=> { location.href='delivery.html'; });
      if(bankBtn) bankBtn.addEventListener('click', ()=> checkoutBankDemo());
      if(codBtn) codBtn.addEventListener('click', ()=> {
        const total = STATE.cart.reduce((s,i)=>s+i.price*i.qty,0);
        const ok = confirm(`Proceed to Pay on Delivery. Total: ₦${total.toLocaleString()}\nChoose OK to confirm your COD order.`);
        if(ok){ placeOrder("COD"); }
      });
    }, 40);
  }
}

// open cart / checkout panel handlers
if(document.getElementById('openCartBtn')) document.getElementById('openCartBtn').onclick = ()=> openCartView();
if(document.getElementById('openMenuBtn')) document.getElementById('openMenuBtn').onclick = ()=> toggleMenu(true);
if(document.getElementById('closeMenuBtn')) document.getElementById('closeMenuBtn').onclick = ()=> toggleMenu(false);
if(document.getElementById('goToCartBtn')) document.getElementById('goToCartBtn').onclick = ()=> openCartView();
if(document.getElementById('checkoutPanelBtn')) document.getElementById('checkoutPanelBtn').onclick = ()=> location.href = 'delivery.html';

function openCartView(){
  // reuse modal if present (index.html), otherwise redirect to cart.html
  if(modalBackdrop){
    let html = `<div style="padding:12px;max-height:70vh;overflow:auto">`;
    if(!STATE.cart.length){ html += `<p class="muted-small">Cart is empty</p>`; }
    for(const it of STATE.cart){
      html += `<div style="display:flex;gap:10px;padding:8px;border-bottom:1px solid rgba(0,0,0,0.04);align-items:center">
        <img src="${it.img}" style="width:72px;height:72px;object-fit:cover;border-radius:8px">
        <div style="flex:1">
          <div style="font-weight:700">${escapeHtml(it.name)}</div>
          <div class="muted-small">${escapeHtml(it.cat)}</div>
          <div style="margin-top:6px">₦${Number(it.price).toLocaleString()} × ${it.qty}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button type="button" class="iconbtn" onclick="window.__inc(${it.id})">+</button>
          <button type="button" class="iconbtn" onclick="window.__dec(${it.id})">−</button>
          <button type="button" class="iconbtn" onclick="window.__rm(${it.id})">Remove</button>
        </div>
      </div>`;
    }
    html += `<div style="margin-top:12px;text-align:right"><strong>Total:</strong> <span style="font-weight:800">₦${STATE.cart.reduce((s,i)=>s+i.price*i.qty,0).toLocaleString()}</span></div>`;
    html += `<div style="display:flex;gap:8px;margin-top:12px"><button id="checkoutCard" class="btn">Pay with Card</button><button id="checkoutBank" class="btn-outline">Pay with Bank</button><button id="checkoutCOD" class="btn-outline">Pay on Delivery</button></div>`;
    html += `</div>`;
    showModal(modalBackdrop);
    const modalInner = document.getElementById('productModal');
    if(modalInner){
      modalInner.querySelector('#detailMainImg').src = '';
      modalInner.querySelector('#detailName').innerText = 'Cart';
      modalInner.querySelector('#detailCat').innerText = '';
      modalInner.querySelector('#detailPrice').innerText = '';
      modalInner.querySelector('#detailDesc').innerHTML = html;
      modalInner.querySelector('#detailAddBtn').style.display='none';
    }
    setTimeout(()=>{
      const cardBtn = document.getElementById('checkoutCard');
      const bankBtn = document.getElementById('checkoutBank');
      const codBtn = document.getElementById('checkoutCOD');
      if(cardBtn) cardBtn.addEventListener('click', ()=> { hideModal(modalBackdrop); location.href='delivery.html'; });
      if(bankBtn) bankBtn.addEventListener('click', ()=> checkoutBankDemo());
      if(codBtn) codBtn.addEventListener('click', ()=> {
        const total = STATE.cart.reduce((s,i)=>s+i.price*i.qty,0);
        const ok = confirm(`Proceed to Pay on Delivery. Total: ₦${total.toLocaleString()}\nChoose OK to confirm your COD order.`);
        if(ok){ placeOrder("COD"); }
      });
    }, 40);
  } else {
    location.href = 'cart.html';
  }
}

// helpers
window.__inc = function(id){ const it=STATE.cart.find(x=>x.id===id); if(it){it.qty++; saveCart();} };
window.__dec = function(id){ const it=STATE.cart.find(x=>x.id===id); if(it){ it.qty=Math.max(1,it.qty-1); saveCart(); } };
window.__rm = function(id){ STATE.cart = STATE.cart.filter(x=>x.id!==id); saveCart(); };

function checkoutBankDemo(){
  if(!modalBackdrop) return location.href='cart.html';
  showModal(modalBackdrop);
  const modalInner = document.getElementById('productModal');
  if(modalInner) modalInner.querySelector('#detailName').innerText = 'Bank Transfer (Demo)';
  if(modalInner) modalInner.querySelector('#detailDesc').innerHTML = `
    <div style="padding:8px;">
      <p class="muted-small">Bank transfers aren't integrated. Use the provided account details to make a transfer and then contact support.</p>
      <div style="margin-top:8px" class="muted-small">
        <div>Account: 0123456789</div>
        <div>Bank: Demo Bank</div>
        <div>Account Name: DamiTools</div>
        <div style="margin-top:8px"><button id="bankPayConfirm" class="btn">I transferred (Demo)</button></div>
      </div>
    </div>`;
  setTimeout(()=> {
    const conf = document.getElementById('bankPayConfirm');
    if(conf) conf.onclick = ()=> placeOrder("Bank (demo)");
  }, 30);
}

function placeOrder(method, deliveryInfo){
  const total = STATE.cart.reduce((s,i)=>s+i.price*i.qty,0);
  if(!STATE.cart.length){ toast("Cart empty"); return; }
  const order = { id: Date.now(), items: STATE.cart, total, method, delivery:deliveryInfo||null, createdAt: new Date().toISOString()};
  const ordersLocal = JSON.parse(localStorage.getItem("damitools_orders")||"[]"); ordersLocal.push(order); localStorage.setItem("damitools_orders", JSON.stringify(ordersLocal));
  if(db){
    try{
      db.collection("orders").add({ total, items: order.items.map(i=>({id:i.id,name:i.name,qty:i.qty,price:i.price})), method, delivery: order.delivery || null, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
        .then(()=> toast("Order placed (cloud)"))
        .catch(()=> toast("Order placed (saved locally)"));
    }catch(e){
      toast("Order placed (saved locally)");
    }
  } else toast("Order placed (saved locally)");
  STATE.cart = []; saveCart();
  hideModal(modalBackdrop);
  setTimeout(()=> alert("Woohoo! Your order is on the move! Get ready — DamiTools got you covered 🚚🎉"), 200);
}

function openAppOrApk(productId){
  const APK_LINK = "https://expo.dev/accounts/oluwadamiloremose/projects/DamiTools/builds/dae29279-7512-4ffc-b646-686c42152592";
  try { const intent = `intent://product/${productId}#Intent;scheme=damitools;package=com.oluwadamilaremose.DamiTools;end`; window.location.href = intent; setTimeout(()=> window.open(APK_LINK, "_blank"), 900); }
  catch(e){ window.open(APK_LINK, "_blank"); }
}

/* ============================
   Search & UI bindings
   ============================ */
const searchInput = document.getElementById('searchInput');
function debounce(fn, wait=220){ let t; return function(...a){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,a), wait); }; }
if(searchInput) searchInput.addEventListener('input', debounce(()=> {
  const q = searchInput.value.trim().toLowerCase();
  if(!q) return renderProducts(STATE.products);
  const filtered = STATE.products.filter(p=> (p.name+' '+(p.cat||'')).toLowerCase().includes(q));
  renderProducts(filtered);
}, 180));

// camera button: allow both camera + file selection (per your request)
const cameraBtn = document.getElementById('cameraBtn');
if(cameraBtn) cameraBtn.addEventListener('click', ()=> {
  // create a chooser that allows taking photo or selecting file
  const chooser = document.createElement('div');
  chooser.style.position='fixed'; chooser.style.left='50%'; chooser.style.top='50%'; chooser.style.transform='translate(-50%,-50%)'; chooser.style.background='var(--card)'; chooser.style.padding='12px'; chooser.style.borderRadius='8px'; chooser.style.boxShadow='0 8px 30px rgba(0,0,0,0.12)'; chooser.style.zIndex=99999;
  chooser.innerHTML = `<div style="display:flex;gap:8px;flex-direction:column;min-width:220px">
    <button id="__cam_take" class="btn">Take photo (camera)</button>
    <button id="__cam_file" class="btn-outline">Choose from files</button>
    <button id="__cam_close" class="iconbtn">Close</button>
  </div>`;
  document.body.appendChild(chooser);
  document.getElementById('__cam_close').onclick = ()=> chooser.remove();
  document.getElementById('__cam_file').onclick = ()=>{
    const fi = document.createElement('input'); fi.type='file'; fi.accept='image/*';
    fi.onchange = ()=> handlePickedImage(fi.files && fi.files[0]);
    fi.click(); chooser.remove();
  };
  document.getElementById('__cam_take').onclick = async ()=>{
    chooser.remove();
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
      try{
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment' } });
        const w = window.open('', '_blank', 'width=420,height=380');
        if(!w){ toast('Please allow popups to use camera'); return; }
        w.document.title = 'Take photo — DamiTools'; w.document.body.style.margin='0'; w.document.body.style.fontFamily='system-ui';
        const video = w.document.createElement('video'); video.autoplay=true; video.style.width='100%'; video.style.height='auto';
        const btn = w.document.createElement('button'); btn.innerText='Capture'; btn.style.fontSize='16px'; btn.style.margin='8px';
        w.document.body.appendChild(video); w.document.body.appendChild(btn);
        video.srcObject = stream;
        btn.onclick = ()=> {
          const canvas = w.document.createElement('canvas'); canvas.width=video.videoWidth; canvas.height=video.videoHeight;
          const ctx = canvas.getContext('2d'); ctx.drawImage(video,0,0,canvas.width,canvas.height);
          canvas.toBlob(async (blob)=>{
            handlePickedImage(new File([blob],'capture.jpg',{type:'image/jpeg'}));
            stream.getTracks().forEach(t=>t.stop());
            w.close();
          }, 'image/jpeg', 0.9);
        };
      }catch(e){ toast('Camera unavailable or permission denied'); }
    } else { toast('Camera not supported'); }
  };
});

function handlePickedImage(file){
  if(!file) return; toast("Photo selected — image search coming soon.");
  const url = URL.createObjectURL(file);
  const w = window.open("");
  if(w){ w.document.write(`<img src="${url}" style="max-width:100%"><p style="font-family:system-ui">Image selected — image search coming soon.</p>`); }
  // Prepared for AI-visual match: store the picked image in localStorage as a tmp key (base64)
  const reader = new FileReader();
  reader.onload = function(e){ try{ localStorage.setItem('damitools_last_image', e.target.result); }catch(_){ }
  };
  reader.readAsDataURL(file);
}

// theme toggle
if(document.getElementById('themeToggle')) document.getElementById('themeToggle').addEventListener('click', ()=> {
  const cur = document.body.getAttribute('data-theme'); const next = cur==='dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next); localStorage.setItem('damitools_theme', next);
});

// menu profile & signout
if(document.getElementById('signOutBtn')) document.getElementById('signOutBtn').addEventListener('click', async ()=>{
  if(auth){ try{ await auth.signOut(); toast('Signed out'); updateProfileUI(null); } catch(e){ console.warn(e); } }
  else { toast('Signed out (local)'); updateProfileUI(null); }
});

function toggleMenu(open){ const el = document.getElementById('menuPanel'); if(!el) return; if(open){ el.classList.add('open'); const av = document.getElementById('avatarEdit'); if(av) av.style.display='block'; } else { el.classList.remove('open'); const av = document.getElementById('avatarEdit'); if(av) av.style.display='none'; } }

if(document.getElementById('menuSupport')) document.getElementById('menuSupport').addEventListener('click', ()=> { alert('Help & Support\nCall: 09036470778\nWhatsApp: 07054700008\nEmail: damitools14@gmail.com'); });
if(document.getElementById('menuProfile')) document.getElementById('menuProfile').addEventListener('click', ()=> { window.location.href = 'login.html'; });
if(document.getElementById('menuAbout')) document.getElementById('menuAbout').addEventListener('click', (e)=> { e.preventDefault(); showModal(document.getElementById('aboutModal')); });
if(document.getElementById('closeAboutBtn')) document.getElementById('closeAboutBtn').addEventListener('click', ()=> hideModal(document.getElementById('aboutModal')) );
if(document.getElementById('navCart')) document.getElementById('navCart').addEventListener('click',(e)=>{ e.preventDefault(); openCartView(); });
if(document.getElementById('navCategories')) document.getElementById('navCategories').addEventListener('click',(e)=>{ e.preventDefault(); toggleCategories(); });

function toggleCategories(){ const el = document.getElementById('catModal'); if(!el) return; if(el.classList.contains('open')){ el.classList.remove('open'); el.setAttribute('aria-hidden','true'); } else { renderCategoryList(); el.classList.add('open'); el.setAttribute('aria-hidden','false'); } }

function renderCategoryList(){ const container = document.getElementById('catList'); if(!container) return; container.innerHTML = ''; const cats = STATE.categories; cats.forEach(cat=>{ const b = document.createElement('div'); b.className = 'cat-item'; b.innerText = cat; b.onclick = ()=> { document.getElementById('catModal').classList.remove('open'); document.getElementById('catModal').setAttribute('aria-hidden','true'); if(cat === 'All') renderProducts(); else { const filtered = STATE.products.filter(p => (p.cat||'').toLowerCase() === cat.toLowerCase()); renderProducts(filtered); } }; container.appendChild(b); }); }

// back button support
window.addEventListener('popstate', function(e){ if(modalBackdrop && modalBackdrop.classList.contains('open')){ modalBackdrop.classList.remove('open'); history.pushState({},''); } });

// profile name helpers
function firstNameFromEmail(email){ if(!email) return ''; const name = email.split('@')[0]; const token = name.split(/[.\-_]/)[0]; return token.charAt(0).toUpperCase() + token.slice(1); }
function safeName(user){ if(!user) return 'Guest'; if(user.displayName) return user.displayName.split(' ')[0]; if(user.email) return firstNameFromEmail(user.email); return 'User'; }

function updateProfileUI(user){ const name = user ? safeName(user) : 'Guest'; const photo = user && user.photoURL ? user.photoURL : (localStorage.getItem('damitools_profile_photo') || 'https://i.imgur.com/6VBx3io.png'); const nameEl = document.getElementById('menuAvatarName'); if(nameEl) nameEl.innerText = name; const emailEl = document.getElementById('menuAvatarEmail'); if(emailEl) emailEl.innerText = 'damitools14@gmail.com'; const imgEl = document.getElementById('menuAvatarImg'); if(imgEl) imgEl.src = photo; }

if(auth){ auth.onAuthStateChanged(user=>{ if(user) updateProfileUI(user); else updateProfileUI(null); }); } else updateProfileUI(null);

// Profile photo upload -> Firebase Storage then update auth profile
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const avatarPreview = document.getElementById('avatarPreview');
if(uploadBtn) uploadBtn.addEventListener('click', ()=> fileInput && fileInput.click());
if(fileInput) fileInput.addEventListener('change', async (ev)=> { const f = ev.target.files && ev.target.files[0]; if(!f) return; await uploadProfileImageFile(f); });
if(takePhotoBtn) takePhotoBtn.addEventListener('click', async ()=>{ if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){ try{ const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'user' } }); const w = window.open('', '_blank', 'width=420,height=380'); if(!w){ toast('Please allow popups to use camera'); return; } w.document.title = 'Take photo — DamiTools'; w.document.body.style.margin='0'; w.document.body.style.fontFamily='system-ui'; const video = w.document.createElement('video'); video.autoplay=true; video.style.width='100%'; video.style.height='auto'; const btn = w.document.createElement('button'); btn.innerText='Capture'; btn.style.fontSize='16px'; btn.style.margin='8px'; w.document.body.appendChild(video); w.document.body.appendChild(btn); video.srcObject = stream; btn.onclick = ()=> { const canvas = w.document.createElement('canvas'); canvas.width=video.videoWidth; canvas.height=video.videoHeight; const ctx = canvas.getContext('2d'); ctx.drawImage(video,0,0,canvas.width,canvas.height); canvas.toBlob(async (blob)=>{ await uploadProfileImageFile(new File([blob],'capture.jpg',{type:'image/jpeg'})); stream.getTracks().forEach(t=>t.stop()); w.close(); }, 'image/jpeg', 0.9); }; }catch(e){ toast('Camera unavailable or permission denied'); } } else { fileInput && fileInput.click(); } });

async function uploadProfileImageFile(file){ if(avatarPreview) avatarPreview.innerHTML = `<div style="width:100px;height:100px;border-radius:8px;overflow:hidden"><img src="${URL.createObjectURL(file)}" style="width:100%;height:100%;object-fit:cover"/></div>`; if(!storage){ const url = URL.createObjectURL(file); localStorage.setItem('damitools_profile_photo', url); updateProfileUI(null); toast('Profile photo saved locally (no Firebase storage)'); return; } toast('Uploading photo...'); try{ const uid = (auth && auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : `guest_${Date.now()}`; const path = `profile_photos/${uid}_${Date.now()}.jpg`; const ref = storage.ref().child(path); const snap = await ref.put(file); const url = await snap.ref.getDownloadURL(); if(auth && auth.currentUser){ try{ await auth.currentUser.updateProfile({ photoURL: url }); } catch(e){ console.warn('updateProfile error', e); } } localStorage.setItem('damitools_profile_photo', url); updateProfileUI(auth && auth.currentUser ? auth.currentUser : null); toast('Profile photo uploaded'); }catch(e){ console.error(e); toast('Upload failed'); } }

/* Modal helpers & init */
function showModal(el){ if(!el) return; el.classList.add('open'); el.setAttribute('aria-hidden','false'); const focusable = el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if(focusable) focusable.focus(); }
function hideModal(el){ if(!el) return; el.classList.remove('open'); el.setAttribute('aria-hidden','true'); }

document.addEventListener('keydown',(ev)=>{ if(ev.key==='Escape'){ hideModal(modalBackdrop); toggleMenu(false); hideModal(document.getElementById('aboutModal')); } });

/* Init */
(function init(){ const savedTheme = localStorage.getItem('damitools_theme'); if(savedTheme) document.body.setAttribute('data-theme', savedTheme); renderProducts(); renderCart(); window.STATE = STATE; // if product.html was opened with ?id=..., open that product
  try{
    const qp = new URLSearchParams(location.search); const id = qp.get('id'); if(id){ const pid = parseInt(id,10); if(!isNaN(pid)) setTimeout(()=> openProductModalById(pid), 120); }
  }catch(e){}
})();
