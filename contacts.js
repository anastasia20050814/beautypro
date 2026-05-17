document.addEventListener('DOMContentLoaded', () => {
  const status = document.querySelector('[data-map-status]');
  const geoBtn = document.querySelector('[data-geolocate]');
  let map = null;
  let userPlacemark = null;

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  if (!window.ymaps) {
    setStatus('Карта не загрузилась. Проверьте API-ключ Yandex Maps.');
    return;
  }

  ymaps.ready(() => {
    map = new ymaps.Map('yandexMap', {
      center: [52.2753, 104.2780],
      zoom: 16,
      controls: ['zoomControl', 'typeSelector']
    });

    const placemark = new ymaps.Placemark([52.2753, 104.2780], {
      hintContent: 'BeautyPro',
      balloonContent: 'BeautyPro · ул. Рябинова 38, Иркутск'
    });

    map.geoObjects.add(placemark);
    setStatus('Маркер установлен по адресу: ул. Рябинова 38, Иркутск.');

    geoBtn?.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Геолокация не поддерживается браузером.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          map.setCenter(coords, 14, { duration: 300 });
          if (userPlacemark) map.geoObjects.remove(userPlacemark);
          userPlacemark = new ymaps.Placemark(coords, {
            hintContent: 'Ваше местоположение'
          }, {
            preset: 'islands#blueCircleDotIcon'
          });
          map.geoObjects.add(userPlacemark);
        },
        () => alert('Не удалось получить местоположение. Разрешите доступ к геолокации.')
      );
    });
  });
});
