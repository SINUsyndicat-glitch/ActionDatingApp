// ==========================================================================
// 10. محرك التحكم، إدارة الحالة ومعالجة الأخطاء والربط السحابي (Firebase)
// ==========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyAjANzHrD-JEEN_4DVIY705ECcJTvl4lQk",
    authDomain: "kriptochat-bf77a.firebaseapp.com",
    databaseURL: "https://kriptochat-bf77a-default-rtdb.firebaseio.com",
    projectId: "kriptochat-bf77a",
    storageBucket: "kriptochat-bf77a.firebasestorage.app",
    messagingSenderId: "438561797154",
    appId: "1:438561797154:web:26e5b2eda081e0eac2467b"
};

try {
    if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
    console.log("🚀 تم تأسيس الرابط السحابي بنجاح.");
} catch (initError) {
    console.error("❌ فشل حرج في تهيئة مصفوفة الخادم السحابي:", initError);
}

const coreAuthInstance = firebase.auth();
const coreDatabaseInstance = firebase.database();

// سجلات ونماذج إدارة الحالة الداخلية (State Hydration Records)
let activeUserSessionProfile = null;
let myCachedProfileDataRecord = null;
let currentAuthPanelMode = "login";
let currentSelectedChatPartnerUid = null; 

let attachedMediaBase64 = "";
let attachedMediaType = "none";
let avatarBase64String = "";
let selectedViewUid = "";

// كائنات التحكم الصارم في هاردوير الكاميرا والمايك المدمج
let localWebcamStreamInstance = null;
let isWebcamVideoTrackEnabled = false;
let isMicrophoneAudioTrackEnabled = false;

const MAX_LOCAL_CACHE_MESSAGES_LIMIT = 60;

// ==========================================================================
// 11. تهيئة مصفوفة الـ Web3 وعناوين عقود البلوكشين الذكية الفعّالة والـ ABI
// ==========================================================================
const KRIPTO_CHAT_CONTRACT_ADDRESS = "0x690192AEeE16c40f6f7d0CA30BAA1B0884259068";
const SINU_TOKEN_CONTRACT_ADDRESS = "0x56bB247c424958948B63de291A0C7f45d8651B76";

const KRIPTO_CHAT_ABI = [
    {"inputs":[{"internalType":"address","name":"_sinuTokenAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
    {"inputs":[],"name":"InsufficientChatBalance","type":"error"},
    {"inputs":[],"name":"InsufficientWalletBalance","type":"error"},
    {"inputs":[],"name":"NoEarnings","type":"error"},
    {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},
    {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},
    {"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},
    {"inputs":[],"name":"TransferFailed","type":"error"},
    {"inputs":[],"name":"UnknownService","type":"error"},
    {"inputs":[],"name":"ZeroAmount","type":"error"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"EarningsWithdrawn","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newTextCost","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newImageCost","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newVoiceCost","type":"uint256"}],"name":"PricesUpdated","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"string","name":"serviceType","type":"string"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"ServiceDeducted","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"SinuDeposited","type":"event"},
    {"inputs":[],"name":"costImage","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"costText","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"costVoice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"_user","type":"address"},{"internalType":"uint256","name":"_serviceType","type":"uint256"}],"name":"deductForService","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"_amountWithDecimals","type":"uint256"}],"name":"depositSinu","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"getInAppBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"sinuToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"totalOwnerEarnings","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"_textWei","type":"uint256"},{"internalType":"uint256","name":"_imageWei","type":"uint256"},{"internalType":"uint256","name":"_voiceWei","type":"uint256"}],"name":"updatePrices","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"withdrawEarnings","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

const SINU_TOKEN_MINIMAL_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

let web3SignerInstance = null;
let kriptoChatContractInstance = null;
let sinuTokenContractInstance = null;

// مصفوفة متجر الهدايا التفاعلية المكونة من 22 نوعاً
const PRESET_LUXURY_GIFTS_COLLECTION = [
    { id: 'rose', name: 'وردة حمراء', price: 10, icon: '🌹' },
    { id: 'heart', name: 'قلب نابض', price: 50, icon: '💖' },
    { id: 'car', name: 'سيارة سباق', price: 500, icon: '🏎️' },
    { id: 'diamond', name: 'الماس نقي', price: 1000, icon: '💎' },
    { id: 'crown', name: 'التاج الملكي', price: 2500, icon: '👑' },
    { id: 'bear', name: 'دبدوب لطيف', price: 30, icon: '🧸' },
    { id: 'ring', name: 'خاتم زواج', price: 800, icon: '💍' },
    { id: 'rocket', name: 'صاروخ SINU', price: 5000, icon: '🚀' },
    { id: 'fire', name: 'شعلة نارية', price: 15, icon: '🔥' },
    { id: 'star', name: 'نجمة ذهبية', price: 20, icon: '⭐' },
    { id: 'kiss', name: 'قبلة طائرة', price: 40, icon: '💋' },
    { id: 'champagne', name: 'احتفال فاخر', price: 600, icon: '🍾' },
    { id: 'island', name: 'جزيرة خاصة', price: 10000, icon: '🏝️' }
];

// ==========================================================================
// 12. دوال التبديل والتحكم بالواجهة الرومانسية
// ==========================================================================
function toggleAuthPanelMode(targetMode) {
    currentAuthPanelMode = targetMode;
    const btnLogin = document.getElementById('btnModeLogin');
    const btnRegister = document.getElementById('btnModeRegister');
    const extFieldsBox = document.getElementById('wrapperFieldUsername');

    if (targetMode === 'login') {
        if(btnLogin) { btnLogin.style.background = "var(--dating-pink)"; btnLogin.style.color = "#fff"; }
        if(btnRegister) { btnRegister.style.background = "transparent"; btnRegister.style.color = "var(--text-main)"; }
        if(extFieldsBox) extFieldsBox.style.display = "none";
    } else {
        if(btnRegister) { btnRegister.style.background = "var(--dating-pink)"; btnRegister.style.color = "#fff"; }
        if(btnLogin) { btnLogin.style.background = "transparent"; btnLogin.style.color = "var(--text-main)"; }
        if(extFieldsBox) extFieldsBox.style.display = "flex";
    }
}

function processSelectedAvatarImage(inputElement) {
    if (!inputElement.files || !inputElement.files[0]) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        avatarBase64String = e.target.result;
        const container = document.getElementById('previewUploaderAvatarContainer');
        if (container) container.innerHTML = `<img src="${avatarBase64String}" style="width:100%; height:100%; object-fit:cover;">`;
    };
    reader.readAsDataURL(inputElement.files[0]);
}

// ==========================================================================
// 13. الدالة الرئيسية للمصادقة وتوصيل الحسابات (المصححة بـ async)
// ==========================================================================
async function executeCoreAuthenticationAction() {
    const emailField = document.getElementById('inputAuthEmail');
    const passwordField = document.getElementById('inputAuthPassword');

    if (!emailField || !passwordField) return;

    const email = emailField.value.trim();
    const password = passwordField.value;

    if (!email || !password) { 
        alert('الرجاء تعبئة كافة الحقول المطلوبة!'); 
        return; 
    }

    try {
        if (currentAuthPanelMode === 'login') {
            await coreAuthInstance.signInWithEmailAndPassword(email, password);
        } else {
            const username = document.getElementById('inputAuthUsername').value.trim().toLowerCase();
            const bioText = document.getElementById('inputAuthBio').value.trim();

            if (!username || username.includes(" ")) { 
                alert('الرجاء صياغة اسم مستخدم فريد وبدون فراغات!'); 
                return; 
            }

            const snapshot = await coreDatabaseInstance.ref('users').orderByChild('username').equalTo(username).once('value');
            if (snapshot.exists()) { 
                alert('اسم الشهرة محجوز مسبقاً!'); 
                return;
            }

            const cred = await coreAuthInstance.createUserWithEmailAndPassword(email, password);
            
            await coreDatabaseInstance.ref(`users/${cred.user.uid}`).set({
                uid: cred.user.uid,
                email: email,
                username: username,
                bio: bioText || "لا توجد نبذة تعريفية.",
                avatarUrl: avatarBase64String || "👤",
                appBalance: 150, 
                walletAddress: "",
                verificationLevel: "عضو عادي",
                isOnline: true,
                lastSeen: Date.now()
            });

            alert("تهانينا! تم إنشاء حسابك الرقمي بنجاح 💖");
        }
    } catch (err) {
        alert(`حدث خطأ أثناء العملية: ${err.message}`);
    }
}

// دالة معالجة المرفقات (تم تصحيح الـ async والـ await بالداخل لمنع الـ SyntaxError)
async function processMediaAttachment(type) {
    const fileInput = type === 'image' ? document.getElementById('postImageInput') : document.getElementById('postVideoInput');
    if (!fileInput || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        attachedMediaBase64 = e.target.result;
        attachedMediaType = type;
        alert(`تم تجهيز ملف الـ ${type} المرفق بنجاح بنظام كود التشفير الحجمي البثي!`);
    };
    reader.readAsDataURL(file);
}

// راقب حالة تسجيل دخول المستخدم لبناء الشاشة حياً
coreAuthInstance.onAuthStateChanged((user) => {
    const backdrop = document.getElementById('coreAuthBackdrop');
    const dashboard = document.getElementById('coreAppMainDashboard');

    if (user) {
        activeUserSessionProfile = user;
        if(backdrop) backdrop.style.display = "none";
        if(dashboard) dashboard.style.display = "grid";
        
        // استدعاء وبناء تيار رادار الأعضاء وجلب البيانات الحية
        initializeDatingSystemEngine(user.uid);
    } else {
        activeUserSessionProfile = null;
        if(backdrop) backdrop.style.display = "flex";
        if(dashboard) dashboard.style.display = "none";
    }
});

function initializeDatingSystemEngine(userId) {
    coreDatabaseInstance.ref(`users/${userId}`).on('value', (snapshot) => {
        myCachedProfileDataRecord = snapshot.val();
        if (!myCachedProfileDataRecord) return;

        document.getElementById('uiSidebarProfileUsername').innerText = `@${myCachedProfileDataRecord.username}`;
        document.getElementById('uiSidebarProfileBioText').innerText = myCachedProfileDataRecord.bio || "";
        
        const avatarImg = document.getElementById('uiSidebarAvatarImage');
        if (myCachedProfileDataRecord.avatarUrl && myCachedProfileDataRecord.avatarUrl.startsWith('data:')) {
            avatarImg.src = myCachedProfileDataRecord.avatarUrl;
        } else {
            avatarImg.src = "https://via.placeholder.com/150";
        }

        document.getElementById('uiBalanceCounterLabel').innerText = `${parseFloat(myCachedProfileDataRecord.appBalance || 0).toFixed(2)} SINU`;
    });

    // تشغيل الردار الفوري
    listenForActiveRadarUsers();
    // تشغيل الخلاصة العامة لبث المنشورات
    listenForGlobalFeedPosts();
    // بناء مصفوفة الهدايا في المتجر
    renderGiftsShopMatrixHTML();
}

function listenForActiveRadarUsers() {
    coreDatabaseInstance.ref('users').on('value', (snapshot) => {
        const usersContainer = document.getElementById('uiActiveOnlineUsersContainer');
        if (!usersContainer) return;
        usersContainer.innerHTML = "";

        let onlineCounter = 0;

        snapshot.forEach((child) => {
            const userData = child.val();
            if (userData.uid === activeUserSessionProfile.uid) return;

            onlineCounter++;
            const userBox = document.createElement('div');
            userBox.className = "radar-user-item";
            userBox.onclick = () => activatePrivateChatChannel(userData.uid, userData.username);

            userBox.innerHTML = `
                <div class="radar-meta-zone">
                    <img src="${userData.avatarUrl && userData.avatarUrl.startsWith('data:') ? userData.avatarUrl : 'https://via.placeholder.com/150'}" class="radar-user-avatar">
                    <div>
                        <strong style="font-size:0.9rem; display:block;">@${userData.username}</strong>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${userData.bio ? userData.bio.substring(0,25) + '...' : ''}</span>
                    </div>
                </div>
                <i class="fa-solid fa-circle" style="color:var(--success); font-size:0.65rem;"></i>
            `;
            usersContainer.appendChild(userBox);
        });

        document.getElementById('radarOnlineCounter').innerText = `${onlineCounter} نشط حياً`;
    });
}

function listenForGlobalFeedPosts() {
    coreDatabaseInstance.ref('posts').limitToLast(MAX_LOCAL_CACHE_MESSAGES_LIMIT).on('value', (snapshot) => {
        const feedContainer = document.getElementById('uiMainMessagesContainer');
        if (!feedContainer) return;
        feedContainer.innerHTML = "";

        let list = [];
        snapshot.forEach(c => { list.unshift({ id: c.key, val: c.val() }); });

        list.forEach(item => {
            const post = item.val;
            const card = document.createElement('div');
            card.className = "render-post-card";
            card.style.marginBottom = "15px";

            let mediaHtml = "";
            if (post.mediaData && post.mediaType === 'image') {
                mediaHtml = `<img src="${post.mediaData}" style="width:100%; border-radius:16px; margin-top:12px; max-height:280px; object-fit:cover;">`;
            } else if (post.mediaData && post.mediaType === 'video') {
                mediaHtml = `<video src="${post.mediaData}" controls style="width:100%; border-radius:16px; margin-top:12px; max-height:280px;"></video>`;
            }

            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                    <img src="${post.senderAvatar || 'https://via.placeholder.com/150'}" style="width:38px; height:38px; border-radius:50%; object-fit:cover;">
                    <div>
                        <strong style="font-size:0.88rem; display:block;">@${post.senderUsername}</strong>
                        <span style="font-size:0.7rem; color:var(--text-muted);">${new Date(post.timestamp).toLocaleTimeString()}</span>
                    </div>
                </div>
                <p style="font-size:0.92rem; white-space:pre-wrap; line-height:1.5;">${post.text}</p>
                ${mediaHtml}
            `;
            feedContainer.appendChild(card);
        });
    });
}

function submitActiveMessageFromToolbar() {
    const text = document.getElementById('inputMainPrimaryTextField').value.trim();
    if (!text && !attachedMediaBase64) return;

    const newPostRef = coreDatabaseInstance.ref('posts').push();
    newPostRef.set({
        text: text || "",
        mediaData: attachedMediaBase64,
        mediaType: attachedMediaType,
        senderUid: activeUserSessionProfile.uid,
        senderUsername: myCachedProfileDataRecord.username,
        senderAvatar: myCachedProfileDataRecord.avatarUrl || "",
        timestamp: Date.now()
    }).then(() => {
        document.getElementById('inputMainPrimaryTextField').value = "";
        attachedMediaBase64 = "";
        attachedMediaType = "none";
    });
}

function renderGiftsShopMatrixHTML() {
    const container = document.getElementById('uiGiftsMatrixGridContainer');
    if (!container) return;
    container.innerHTML = "";

    PRESET_LUXURY_GIFTS_COLLECTION.forEach(gift => {
        const item = document.createElement('div');
        item.className = "matrix-gift-item";
        item.onclick = () => executeTriggerSendGiftToPartner(gift.id, gift.icon, gift.price);
        item.innerHTML = `
            <span style="font-size:1.6rem;">${gift.icon}</span>
            <span style="font-size:0.68rem; font-weight:bold; display:block;">${gift.name}</span>
            <span style="font-size:0.62rem; color:var(--dating-pink);">${gift.price} 🪙</span>
        `;
        container.appendChild(item);
    });
}

function activatePrivateChatChannel(partnerUid, partnerUsername) {
    currentSelectedChatPartnerUid = partnerUid;
    document.getElementById('currentChatPartnerNameText').innerText = `@${partnerUsername}`;
    
    const chatBox = document.getElementById('privateChatMessagesScrollBox');
    chatBox.innerHTML = `<div style="text-align:center; font-size:0.8rem; color:var(--text-muted); padding:20px;">تأسيس القناة المشفرة بنجاح...</div>`;

    const channelId = activeUserSessionProfile.uid < partnerUid ? `${activeUserSessionProfile.uid}_${partnerUid}` : `${partnerUid}_${activeUserSessionProfile.uid}`;
    
    coreDatabaseInstance.ref(`chats/${channelId}`).limitToLast(30).on('value', (snapshot) => {
        chatBox.innerHTML = "";
        if (!snapshot.exists()) {
            chatBox.innerHTML = `<div style="text-align:center; font-size:0.8rem; color:var(--text-muted); padding:20px;">لا توجد رسائل سابقة. ابدأ المحادثة الآن 💖</div>`;
            return;
        }

        snapshot.forEach(child => {
            const msg = child.val();
            const msgBubble = document.createElement('div');
            const isMe = msg.senderUid === activeUserSessionProfile.uid;
            
            msgBubble.className = "msg-bubble-card";
            msgBubble.style.alignSelf = isMe ? "flex-start" : "flex-end";
            msgBubble.style.background = isMe ? "var(--dating-pink)" : "#fff";
            msgBubble.style.color = isMe ? "#fff" : "var(--text-main)";
            msgBubble.style.borderRadius = isMe ? "18px 18px 0 18px" : "18px 18px 18px 0";
            msgBubble.style.padding = "10px 14px";
            msgBubble.style.border = isMe ? "none" : "1px solid var(--border-color)";
            msgBubble.style.fontSize = "0.85rem";
            msgBubble.style.width = "fit-content";
            msgBubble.style.marginBottom = "5px";

            msgBubble.innerText = msg.text;
            chatBox.appendChild(msgBubble);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    // تشغيل مستمع المؤثرات البصرية للهدايا حياً لهذه القناة المفتوحة
    listenForIncomingGiftsInStream(channelId);
}

function submitPrivateChatMessageFromZone() {
    const text = document.getElementById('inputPrivateMessageTextField').value.trim();
    if (!text || !currentSelectedChatPartnerUid) return;

    const channelId = activeUserSessionProfile.uid < currentSelectedChatPartnerUid ? `${activeUserSessionProfile.uid}_${currentSelectedChatPartnerUid}` : `${currentSelectedChatPartnerUid}_${activeUserSessionProfile.uid}`;
    
    const newMsgRef = coreDatabaseInstance.ref(`chats/${channelId}`).push();
    newMsgRef.set({
        text: text,
        senderUid: activeUserSessionProfile.uid,
        timestamp: Date.now()
    }).then(() => {
        document.getElementById('inputPrivateMessageTextField').value = "";
    });
}

function executeTriggerSendGiftToPartner(giftId, icon, price) {
    if (!currentSelectedChatPartnerUid) { alert('الرجاء اختيار صديق من الرادار أولاً لإرسال الهدية!'); return; }
    
    if ((myCachedProfileDataRecord.appBalance || 0) < price) {
        alert('رصيدك غير كافٍ لشراء وإرسال هذه الهدية الفاخرة! اشحن محفظتك بـ $SINU');
        return;
    }

    const channelId = activeUserSessionProfile.uid < currentSelectedChatPartnerUid ? `${activeUserSessionProfile.uid}_${currentSelectedChatPartnerUid}` : `${currentSelectedChatPartnerUid}_${activeUserSessionProfile.uid}`;
    
    // خصم قيمة الهدية من الراسل
    coreDatabaseInstance.ref(`users/${activeUserSessionProfile.uid}/appBalance`).set(myCachedProfileDataRecord.appBalance - price)
        .then(() => {
            // تسجيل تفجير الهدية في مستمع القناة الحية
            return coreDatabaseInstance.ref(`live_streams/${channelId}/gifts_sent`).push({
                giftId: giftId,
                giftIcon: icon,
                senderUsername: myCachedProfileDataRecord.username,
                timestamp: Date.now()
            });
        }).then(() => {
            alert(`تم إرسال الهدية (${icon}) بنجاح وخصم التكلفة برمجياً!`);
        });
}

function listenForIncomingGiftsInStream(channelId) {
    coreDatabaseInstance.ref(`live_streams/${channelId}/gifts_sent`).orderByChild('timestamp').startAt(Date.now()).on('child_added', (snapshot) => {
        const giftData = snapshot.val();
        if (!giftData) return;

        triggerPremiumOverlayGiftAnimation(giftData.giftIcon);
    });
}

function triggerPremiumOverlayGiftAnimation(icon) {
    const container = document.getElementById('globalLiveScreenOverlay');
    if (!container) return;

    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const emoji = document.createElement('div');
            emoji.className = "floating-overlay-emoji";
            emoji.innerText = icon;
            emoji.style.left = `${Math.random() * 85 + 5}%`;
            emoji.style.animationDelay = `${Math.random() * 0.6}s`;
            container.appendChild(emoji);

            setTimeout(() => emoji.remove(), 4000);
        }, i * 80);
    }
}

// الكاميرا والمايك
function toggleLocalWebcamHardwareState() {
    const videoElement = document.getElementById('hardwareLocalWebcamVideo');
    const fallbackText = document.getElementById('cameraFallbackText');
    
    if (!isWebcamVideoTrackEnabled) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localWebcamStreamInstance = stream;
                videoElement.srcObject = stream;
                isWebcamVideoTrackEnabled = true;
                if(fallbackText) fallbackText.style.display = "none";
                document.getElementById('btnToggleCameraDevice').innerHTML = `<i class="fa-solid fa-video-slash"></i>`;
            })
            .catch(err => alert('تعذر الوصول إلى كاميرا الهاتف الشخصية: ' + err.message));
    } else {
        if(localWebcamStreamInstance) {
            localWebcamStreamInstance.getTracks().forEach(track => track.stop());
        }
        videoElement.srcObject = null;
        isWebcamVideoTrackEnabled = false;
        if(fallbackText) fallbackText.style.display = "flex";
        document.getElementById('btnToggleCameraDevice').innerHTML = `<i class="fa-solid fa-video"></i>`;
    }
}

function toggleLocalMicrophoneHardwareState() {
    if (!localWebcamStreamInstance) return;
    isMicrophoneAudioTrackEnabled = !isMicrophoneAudioTrackEnabled;
    localWebcamStreamInstance.getAudioTracks().forEach(track => track.enabled = isMicrophoneAudioTrackEnabled);
    document.getElementById('btnToggleAudioDevice').innerHTML = isMicrophoneAudioTrackEnabled ? `<i class="fa-solid fa-microphone-slash"></i>` : `<i class="fa-solid fa-microphone"></i>`;
}

// ==========================================================================
// 14. اتصال الـ Web3 الحقيقي بمحفظة الموبايل وشحن الـ Contract
// ==========================================================================
async function connectWeb3WalletBridge() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            web3SignerInstance = provider.getSigner();
            const walletAddress = await web3SignerInstance.getAddress();

            kriptoChatContractInstance = new ethers.Contract(KRIPTO_CHAT_CONTRACT_ADDRESS, KRIPTO_CHAT_ABI, web3SignerInstance);
            sinuTokenContractInstance = new ethers.Contract(SINU_TOKEN_CONTRACT_ADDRESS, SINU_TOKEN_MINIMAL_ABI, web3SignerInstance);

            document.getElementById('uiConnectedWalletAddressTag').innerText = `${walletAddress.substring(0,6)}...${walletAddress.substring(38)}`;
            
            // قراءة الرصيد البلوكشيني فوراً
            updateWeb3OnchainBalances(walletAddress);
        } catch (e) {
            alert("فشل ربط عقد المحفظة التكتيكية: " + e.message);
        }
    } else {
        alert("لم يتم العثور على محفظة ويب 3 داخل متصفح الهاتف! استخدم متصفح محفظة MetaMask أو Trust Wallet.");
    }
}

async function updateWeb3OnchainBalances(walletAddress) {
    if (!sinuTokenContractInstance || !kriptoChatContractInstance) return;
    try {
        const walletBal = await sinuTokenContractInstance.balanceOf(walletAddress);
        document.getElementById('onchainWalletBalanceLabel').innerText = parseFloat(ethers.utils.formatEther(walletBal)).toFixed(2);

        const contractBal = await kriptoChatContractInstance.getInAppBalance(walletAddress);
        document.getElementById('onchainContractInAppBalanceLabel').innerText = parseFloat(ethers.utils.formatEther(contractBal)).toFixed(2);
    } catch (err) {
        console.error("فشل قراءة أرصدة البلوكشين الذكية حياً:", err);
    }
}

async function executeWeb3DepositSinuToContract() {
    const amountStr = document.getElementById('inputDepositAmountWeiField').value.trim();
    if (!amountStr || !kriptoChatContractInstance || !sinuTokenContractInstance) { alert('الرجاء التأكد من ربط المحفظة وإدخال القيمة الحجمية!'); return; }

    try {
        const amountWei = ethers.utils.parseEther(amountStr);
        alert('انتظر.. نقوم حالياً بعمل تفعيل وتفويض (Approve) للعملة على شبكة البلوكشين الذكية...');
        
        const txApprove = await sinuTokenContractInstance.approve(KRIPTO_CHAT_ADDRESS, amountWei);
        await txApprove.wait();

        alert('نجح التفويض! جاري تنفيذ معاملة الإيداع والشحن الفورية داخل عقد SINU الذكي...');
        const txDeposit = await kriptoChatContractInstance.depositSinu(amountWei);
        await txDeposit.wait();

        alert('تهانينا الفائقة! تم شحن محفظة العقد على شبكة البلوكشين بنجاح سرمدي 🌐');
    } catch (err) {
        alert('فشلت معاملة البلوكشين: ' + err.message);
    }
}
