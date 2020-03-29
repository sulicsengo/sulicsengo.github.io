let schedule = [
    [8,0], [8,45],
    [8,55], [9,40],
    [9,50], [10,35],
    [10,45], [11,30],
    [11,40], [12,25],
    [12,45], [13,30],
    [13,40], [14,25],
    [14,30], [15,10],
    [15,15], [15,55]
];
var lastBreak = true, soundEnabled = false, timer, currentSound = "handbell.mp3", settings = {}, ignoreCB = false;
var checkbox = new Switch(soundCB, { 
		onSwitchColor: 'rgb(40, 189, 74)',
		offSwitchColor: 'rgb(143, 197, 155)',
		onJackColor: 'rgb(3, 245, 111)',
		offJackColor: '#fff',
		onChange: ()=>{ if(!ignoreCB) enableSound(); } 
	});

var bellSound = new Audio("sfx/"+currentSound);
bellSound.muted = true;

function enableSound() {
	bellSound.play().then(resetAudio);
	soundEnabled = !soundEnabled;
	soundStatus.innerHTML = soundEnabled ? "bekapcsolva" : "kikapcsolva";
	settings.soundEnabled = soundEnabled;
	saveSettings();
}
soundCB.addEventListener("click", enableSound);

function firstInteract() {
	bellSound.play().then(resetAudio);
	init.style.display = "none";
	board.style.display = "block";
}
initBTN.addEventListener("click", firstInteract);

toggleSettings.addEventListener("click", askCookie);
backBtn.addEventListener("click", ()=>{ resetAudio(); board.style.display = "block"; settingsDOM.style.display = "none"; });

function saveSettings() {
	if(getCookie("cookieAccepted"))
		setCookie("settings", JSON.stringify(settings), 99999);
}
function loadSettings() {
	if(!getCookie("cookieAccepted")) return;
	settings = getCookie("settings");
	if(!settings) return;
	settings = JSON.parse(settings);
	if(settings.soundEnabled) enableSound();
	if(settings.sound) {
		document.querySelector('#sounds button.selected').className = "";
		if(settings.sound.startsWith("custom")) {
			currentSound = settings.sound.substr(6);
			document.querySelector("#sounds button[data-target=custom]").className = "selected";
		} else {
			currentSound = settings.sound;
			document.querySelector("#sounds button[data-target=\""+currentSound+"\"]").className = "selected";
		}
	}
	if(settings.schedule) schedule = settings.schedule;
}

function askCookie() {
    board.style.display = "none";
    if(!getCookie("cookieAccepted")) cookiealert.style.display = "block";
    else {
		settingsDOM.style.display = "block";
		if(soundEnabled) {
			ignoreCB = true;
			checkbox.on();
			ignoreCB = false;
		}
	}
}

function cookieReact(accepted) {
    cookiealert.style.display = "none";
    document.getElementById(accepted ? "settingsDOM" : "board").style.display = "block";
    if(accepted) setCookie("cookieAccepted", "true", 99999);
}
cookieDecline.addEventListener("click", () => { cookieReact(false) });
cookieAccept.addEventListener("click", () => { cookieReact(true) });


function resetAudio() {
    bellSound.pause();
    bellSound.currentTime = 0;
    bellSound.muted = false;
}

function getCurrentLesson() {
    let d = new Date();
    let h = d.getHours();
    let m = d.getMinutes();
    let i = 0;
    while(i < schedule.length) {
        let s2 = schedule[i][0]*60 + schedule[i][1];
        if((h*60+m) < s2) {
            i--;
            break;
        } else i++;
    }
    let isBreakNow = i%2;
    if(lastBreak != isBreakNow) {
        if(soundEnabled) bellSound.play();
        lastBreak = isBreakNow;
    }
    
    timer = setTimeout(getCurrentLesson, 60E3);
    
    if(i == schedule.length || i == -1) {
        isBreak.innerHTML = "nincs tanítás";
        isBreak.style.color = "#F00";
        untilWhat.innerHTML = "Az első óráig";
        untilWhat.style.color = "#0F0";
        statusDOM.innerHTML = "";
		nprefixDOM.innerHTML = "";
        
        time.innerHTML = s2hs((schedule[0][0]*60+schedule[0][1]>h*60+m?0:24*60)+schedule[0][0]*60+schedule[0][1]-h*60-m);
        lessonStartDOM.innerHTML = schedule[schedule.length-1][0]+":"+schedule[schedule.length-1][1].toString().padStart(2,'0');
        currentTime.innerHTML = h+":"+m.toString().padStart(2,'0');
        lessonEndDOM.innerHTML = schedule[0][0]+":"+schedule[0][1].toString().padStart(2,'0');
        return;
    }
    
    let lessonCount = Math.floor(i/2)+1,
        lessonStart = schedule[i];
        lessonEnd = schedule[i+1];

	nprefixDOM.innerHTML = isBreakNow ? "" : nprefix(lessonCount)+" ";
    isBreak.innerHTML = isBreakNow ? "szünet" : lessonCount + ". óra";
    isBreak.style.color = isBreakNow ? "#0F0" : "#F00";
    statusDOM.innerHTML = " van!";
    
    untilWhat.innerHTML = isBreakNow?"Becsengetésig":"Szünetig";
    untilWhat.style.color = !isBreakNow ? "#0F0" : "#F00";
    
    time.innerHTML = s2hs((lessonEnd[0]*60+lessonEnd[1])-(h*60+m));
    lessonStartDOM.innerHTML = lessonStart[0]+":"+lessonStart[1].toString().padStart(2,'0');
    currentTime.innerHTML = h+":"+m.toString().padStart(2,'0');
    lessonEndDOM.innerHTML = lessonEnd[0]+":"+lessonEnd[1].toString().padStart(2,'0');
}

function loadSchedule() {
	for(let i = 0; i < schedule.length-1; i+=2) {
		if(schedule.length <= i) return;
		
		let node = scheduleSample.cloneNode(true);
		let lc = i/2+1;
		node.id = "lesson_"+lc;
		node.children[0].innerHTML = lc+". óra:";
		node.children[1].children[0].value = schedule[i][0];
		node.children[1].children[1].value = schedule[i][1];
		node.children[1].children[2].value = schedule[i+1][0];
		node.children[1].children[3].value = schedule[i+1][1];
		document.querySelector("#scheduleDOM tbody").appendChild(node);
	}
}

function saveSchedule() {
	let i = 1;
	let newSchedule = [];
	let lastEnd = 0;
	while((el = document.getElementById("lesson_"+i))) {
		el.className = "fail"
		let h1 = parseInt(el.children[1].children[0].value),
			m1 = parseInt(el.children[1].children[1].value),
			h2 = parseInt(el.children[1].children[2].value),
			m2 = parseInt(el.children[1].children[3].value);
		if(isNan2(h1, m1, h2, m2) || h1 < 0 || h1 > 24 || h2 < 0 || m1 < 0 || m1 > 59 || m2 < 0 || m2 > 59) return;
		if(h1*60+m1 > h2*60+m2) return alert("Nem fejeződhet előbb "+nprefix(i)+" "+i+". óra, mint hogy elkezdődjön!");
		if(h1*60+m1 < lastEnd) return alert("Nem kezdődhet előbb "+nprefix(i)+" "+i+". óra, mint "+nprefix(i-1)+" "+(i-1)+".!");
		lastEnd = h2*60+m2;
		i++;
		newSchedule.push([h1,m1], [h2,m2]);
		el.className = "";
	}
	schedule = newSchedule;
	settings.schedule = schedule;
	saveSettings();
	getCurrentLesson();
	nextMinuteTimer();
}
saveScheduleBTN.addEventListener("click", saveSchedule);

function changeSound(e) {
	resetAudio();
	let t = e.target.dataset.target;
	if(!t) return;
	if(t == currentSound && !bellSound.ended && !bellSound.paused) return;
	if(t == "custom") {
		let s = prompt("Másold be ide az egyéni csengő linkjét!");
		if(!s) return;
		bellSound.src = s;
		settings.sound = "custom"+s;
		bellSound.play().then(function(){}).catch(function(){alert("Hibás link")});
	} else {
		bellSound.src = "sfx/"+t;
		settings.sound = t;
	}
	
	if(soundEnabled) bellSound.play();
	currentSound = t;
	saveSettings();
	
	document.querySelector('#sounds button.selected').className = "";
	e.target.className = "selected";
}
sounds.addEventListener("click", changeSound);

function nextMinuteTimer() {
	if(timer) clearTimeout(timer);
	let secondsUntilNextMinute = 60 - Math.floor(Date.now() / 1000)%60;
	timer = setTimeout(getCurrentLesson, secondsUntilNextMinute * 1E3);
}
loadSettings();
loadSchedule();
getCurrentLesson();
nextMinuteTimer();

function s2hs(s) { let h = Math.floor(s/60); s -= h*60; return h>0?h+" óra "+s+" perc":s+" perc"; }
function nprefix(n) { return ["1","5"].indexOf(n.toString()[0])!=-1?"az":"a"; }
function isNan2() { for(var k in arguments) { if(isNaN(arguments[k])) return true; } return false; }