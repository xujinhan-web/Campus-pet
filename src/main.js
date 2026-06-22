const pets = [
  { id: 'xiaoju', name: '小橘', emoji: '🐱', color: 'orange', personality: ['亲人', '爱睡觉', '图书馆常驻'], locations: ['图书馆门口', '北区草坪'], health: '轻微护理中', sterilized: '已绝育', vaccine: '未知', needIds: ['food-xiaoju', 'skin-xiaoju'] },
  { id: 'baibai', name: '白白', emoji: '🐈', color: 'white', personality: ['警惕', '喜欢晒太阳'], locations: ['艺术楼', '南门花坛'], health: '健康', sterilized: '未绝育', vaccine: '未知', needIds: ['sterilize-baibai'] },
  { id: 'ahuang', name: '阿黄', emoji: '🐶', color: 'brown', personality: ['温顺', '爱陪跑'], locations: ['操场', '体育馆'], health: '健康', sterilized: '未绝育', vaccine: '未知', needIds: ['food-ahuang'] },
]

const dates = ['2026-06-20', '2026-06-21', '2026-06-22']
const savedState = JSON.parse(localStorage.getItem('campusPetMvpState') || '{}')

let state = {
  schoolSelected: savedState.schoolSelected ?? false,
  selectedDate: '2026-06-22',
  selectedPetId: 'xiaoju',
  modal: null,
  lightboxId: null,
  mapImage: savedState.mapImage ?? '',
  sightings: savedState.sightings ?? [
    { id: 's1', petId: 'xiaoju', photo: '小橘', mapX: 34, mapY: 39, caption: '图书馆门口睡得很香', date: '2026-06-22', time: '14:20' },
    { id: 's2', petId: 'baibai', photo: '白白', mapX: 62, mapY: 32, caption: '艺术楼旁边晒太阳', date: '2026-06-22', time: '11:10' },
    { id: 's3', petId: 'ahuang', photo: '阿黄', mapX: 72, mapY: 70, caption: '操场边陪同学跑步', date: '2026-06-21', time: '18:30' },
  ],
  needs: savedState.needs ?? [
    { id: 'food-xiaoju', petId: 'xiaoju', title: '小橘本周猫粮补充', description: '用于购买主粮和罐罐，由云杉大学护爪社统一采购。', target: 120, current: 85 },
    { id: 'skin-xiaoju', petId: 'xiaoju', title: '小橘皮肤护理药膏', description: '用于购买皮肤药膏和驱虫用品。', target: 300, current: 185 },
    { id: 'sterilize-baibai', petId: 'baibai', title: '白白绝育预约基金', description: '用于白白绝育手术和术后护理。', target: 600, current: 240 },
    { id: 'food-ahuang', petId: 'ahuang', title: '阿黄日常犬粮补充', description: '用于购买犬粮和饮水碗。', target: 180, current: 70 },
  ],
}

const root = document.querySelector('#root')
const petById = (id) => pets.find((pet) => pet.id === id) ?? pets[0]
const persistState = () => {
  localStorage.setItem('campusPetMvpState', JSON.stringify({
    schoolSelected: state.schoolSelected,
    mapImage: state.mapImage,
    sightings: state.sightings,
    needs: state.needs,
  }))
}
const setState = (patch) => { state = { ...state, ...patch }; persistState(); render() }

function render() {
  root.innerHTML = state.schoolSelected ? appView() : landingView()
  bindEvents()
}

function landingView() {
  return `
    <main class="landing">
      <div class="landing-card">
        <div class="paw-bubble">🐾</div>
        <p class="eyebrow">Campus Pet Web Demo</p>
        <h1>把校园里的毛孩子画进地图</h1>
        <p class="lead">像翻开一本校园手账：上传偶遇、回看日期、查看健康档案，也给保护组织留下一笔透明的照护记录。</p>
        <div class="search-box">搜索你的大学... <span>⌘K</span></div>
        <div class="school-grid">
          <button class="school-card js-enter"><strong>云杉大学</strong><span>3 只校宠 · 已认证护爪社</span></button>
          <button class="school-card muted"><strong>南湖学院</strong><span>即将开放</span></button>
        </div>
        <button class="primary-button js-enter">进入云杉大学校宠地图</button>
      </div>
    </main>`
}

function appView() {
  const selectedPet = petById(state.selectedPetId)
  const currentSightings = state.sightings.filter((sighting) => sighting.date === state.selectedDate)
  const lightbox = state.lightboxId ? state.sightings.find((sighting) => sighting.id === state.lightboxId) : null
  return `
    <main class="app-shell">
      <section class="hero-bar">
        <div><p class="eyebrow">Campus Pet MVP · 云杉大学护爪地图</p><h1>今天是谁的巡逻路线？</h1></div>
        <button class="ghost-button js-back">切换学校</button>
      </section>
      <section class="workspace">
        <div class="map-panel">
          <div class="top-dock"><div class="pet-dock">${pets.map(petChip).join('')}</div><button class="date-button js-map-upload">🗺️ 上传地图</button><button class="date-button js-calendar">📅 ${state.selectedDate}</button></div>
          ${mapView(currentSightings)}
          <button class="upload-fab js-upload">＋ 贴一张偶遇</button>
        </div>
        ${profileView(selectedPet)}
      </section>
      ${orgPanel()}
      ${state.modal === 'upload' ? uploadModal() : ''}
      ${state.modal === 'calendar' ? calendarModal() : ''}
      ${state.modal === 'mapUpload' ? mapUploadModal() : ''}
      ${lightbox ? lightboxModal(lightbox) : ''}
    </main>`
}

function petChip(pet) {
  return `<button class="pet-chip ${state.selectedPetId === pet.id ? 'active' : ''}" data-pet="${pet.id}"><span class="avatar ${pet.color}">${pet.emoji}</span>${pet.name}</button>`
}

function mapView(sightings) {
  const imageStyle = state.mapImage ? ` style="background-image: linear-gradient(rgba(255,248,237,.58), rgba(255,248,237,.58)), url('${state.mapImage}')"` : ''
  return `<div class="campus-map${state.mapImage ? ' has-image' : ''}"${imageStyle}>
    <div class="map-label library">图书馆</div><div class="map-label art">艺术楼</div><div class="map-label track">操场</div><div class="map-road horizontal"></div><div class="map-road vertical"></div>
    ${sightings.map((sighting) => {
      const pet = petById(sighting.petId)
      return `<button class="photo-marker" data-photo="${sighting.id}" style="left:${sighting.mapX}%;top:${sighting.mapY}%"><span>${pet.emoji}</span><strong>${sighting.photo}</strong><small>${sighting.time}</small></button>`
    }).join('')}
    ${sightings.length === 0 ? '<div class="empty-map">📷 这一天还没有偶遇记录</div>' : ''}
  </div>`
}

function profileView(pet) {
  const needs = state.needs.filter((need) => pet.needIds.includes(need.id))
  const sightings = state.sightings.filter((sighting) => sighting.petId === pet.id)
  return `<aside class="profile-card">
    <div class="profile-hero"><span class="big-avatar ${pet.color}">${pet.emoji}</span><div><p class="eyebrow">护爪档案卡</p><h2>${pet.name}</h2><p>${pet.locations.join(' / ')}</p></div></div>
    <div class="tag-row">${pet.personality.map((tag) => `<span>${tag}</span>`).join('')}</div>
    <div class="status-grid"><div><strong>${pet.health}</strong><span>身体状况</span></div><div><strong>${pet.sterilized}</strong><span>绝育状态</span></div><div><strong>${pet.vaccine}</strong><span>疫苗状态</span></div></div>
    <section class="needs-list"><h3>🤝 当前需要</h3>${needs.map(needView).join('')}<p class="demo-note">当前为 Web Demo，捐助为模拟流程，不会产生真实付款。</p></section>
    <section><h3>记忆贴纸</h3><div class="mini-gallery">${sightings.slice(0, 6).map((s) => `<span>${s.photo}</span>`).join('')}</div></section>
  </aside>`
}

function needView(need) {
  const progress = Math.min(100, Math.round((need.current / need.target) * 100))
  return `<article class="need-card"><div class="need-head"><strong>${need.title}</strong><span>¥${need.current} / ¥${need.target}</span></div><p>${need.description}</p><div class="progress"><span style="width:${progress}%"></span></div><button data-donate="${need.id}">模拟捐助 ¥20</button></article>`
}

function orgPanel() {
  return `<section class="org-panel"><div><span class="org-icon">✓</span><div><strong>云杉大学护爪社</strong><p>已认证保护组织 · 管理 3 只校宠 · 本月模拟捐助 ¥1,260</p></div></div><ul><li>¥58 小橘皮肤护理药膏</li><li>¥220 本周公共猫粮</li><li>¥400 白白绝育预约金</li></ul></section>`
}

function uploadModal() {
  return `<div class="modal-backdrop"><form class="modal-card js-upload-form"><button type="button" class="close-button js-close">×</button><h2>贴一张今日偶遇</h2>
    <label>选择校宠<select name="petId">${pets.map((pet) => `<option value="${pet.id}">${pet.name}</option>`).join('')}</select></label>
    <label>日期<select name="date">${dates.map((date) => `<option ${date === state.selectedDate ? 'selected' : ''}>${date}</option>`).join('')}</select></label>
    <label>备注<input name="caption" value="今天在食堂门口见到 TA" /></label>
    <div class="picker-map js-picker"><span class="pin" style="left:48%;top:54%">📍</span></div><input type="hidden" name="mapX" value="48" /><input type="hidden" name="mapY" value="54" />
    <p class="demo-note">为了保护校宠安全，请标记大概区域，不要暴露窝点或过于精确的位置。</p><button class="primary-button">贴到地图上</button></form></div>`
}

function mapUploadModal() {
  return `<div class="modal-backdrop"><div class="modal-card compact"><button class="close-button js-close">×</button><h2>上传校园平面图</h2><p class="demo-note">选择一张校园平面图后，地图照片点位会覆盖在图片上。图片只保存在当前浏览器 LocalStorage。</p><label>校园地图图片<input class="js-map-file" type="file" accept="image/*" /></label><button class="ghost-button js-reset-map">恢复手绘占位地图</button></div></div>`
}

function calendarModal() {
  return `<div class="modal-backdrop"><div class="modal-card compact"><button class="close-button js-close">×</button><h2>校宠记忆日历</h2><div class="calendar-grid">${dates.map((date) => `<button class="js-date ${date === state.selectedDate ? 'selected' : ''}" data-date="${date}"><strong>${date.slice(5)}</strong><span>${state.sightings.filter((s) => s.date === date).length} 张</span></button>`).join('')}</div></div></div>`
}

function lightboxModal(sighting) {
  const pet = petById(sighting.petId)
  return `<div class="modal-backdrop"><div class="lightbox-card"><button class="close-button js-lightbox-close">×</button><div class="lightbox-photo"><span>${pet.emoji}</span>${sighting.photo}</div><h2>${pet.name} · ${sighting.date}</h2><p>${sighting.caption}</p></div></div>`
}

function bindEvents() {
  document.querySelectorAll('.js-enter').forEach((el) => el.addEventListener('click', () => setState({ schoolSelected: true })))
  document.querySelector('.js-back')?.addEventListener('click', () => setState({ schoolSelected: false }))
  document.querySelector('.js-calendar')?.addEventListener('click', () => setState({ modal: 'calendar' }))
  document.querySelector('.js-map-upload')?.addEventListener('click', () => setState({ modal: 'mapUpload' }))
  document.querySelector('.js-upload')?.addEventListener('click', () => setState({ modal: 'upload' }))
  document.querySelectorAll('[data-pet]').forEach((el) => el.addEventListener('click', () => setState({ selectedPetId: el.dataset.pet })))
  document.querySelectorAll('[data-photo]').forEach((el) => el.addEventListener('click', () => setState({ lightboxId: el.dataset.photo })))
  document.querySelectorAll('[data-donate]').forEach((el) => el.addEventListener('click', () => {
    state.needs = state.needs.map((need) => need.id === el.dataset.donate ? { ...need, current: Math.min(need.target, need.current + 20) } : need)
    persistState(); render()
  }))
  document.querySelectorAll('.js-close').forEach((el) => el.addEventListener('click', () => setState({ modal: null })))
  document.querySelector('.js-reset-map')?.addEventListener('click', () => setState({ mapImage: '', modal: null }))
  document.querySelector('.js-map-file')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setState({ mapImage: reader.result, modal: null })
    reader.readAsDataURL(file)
  })
  document.querySelector('.js-lightbox-close')?.addEventListener('click', () => setState({ lightboxId: null }))
  document.querySelectorAll('.js-date').forEach((el) => el.addEventListener('click', () => setState({ selectedDate: el.dataset.date, modal: null })))
  document.querySelector('.js-picker')?.addEventListener('click', (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const mapX = Math.round(((event.clientX - rect.left) / rect.width) * 100)
    const mapY = Math.round(((event.clientY - rect.top) / rect.height) * 100)
    document.querySelector('input[name="mapX"]').value = mapX
    document.querySelector('input[name="mapY"]').value = mapY
    document.querySelector('.pin').style.left = `${mapX}%`
    document.querySelector('.pin').style.top = `${mapY}%`
  })
  document.querySelector('.js-upload-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const pet = petById(form.get('petId'))
    const date = form.get('date')
    state.sightings = [{ id: `s${Date.now()}`, petId: pet.id, photo: pet.name, mapX: Number(form.get('mapX')), mapY: Number(form.get('mapY')), caption: form.get('caption'), date, time: '刚刚' }, ...state.sightings]
    persistState()
    setState({ selectedDate: date, selectedPetId: pet.id, modal: null })
  })
}

render()
