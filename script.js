document.addEventListener('DOMContentLoaded', () => {
    const stationSelect = document.getElementById('stationSelect');
    const scheduleList = document.getElementById('scheduleList');

    // Lisätään tapahtumankuuntelija aseman valintaan
    stationSelect.addEventListener('change', getSchedules);

    // Haetaan aikataulujen tiedot API:sta
    function getSchedules() {
        const stationCode = stationSelect.value;

        // Tarkistetaan onko asema valittu
        if (!stationCode) {
            alert('Valitse asema ensin.');
            return;
        }

        // Suora API-kutsu ilman proxyä
        const url = `https://rata.digitraffic.fi/api/v1/live-trains/station/${stationCode}?departing_trains=10`;

        // Haetaan data API:sta
        fetch(url)
            .then(response => {
                // jos ei saada vastausta, heitetään virhe
                if (!response.ok) {
                    throw new Error('Virhe haettaessa dataa.');
                }
                // Palautetaan JSON-muodossa
                return response.json(); 
            })
            .then(data => {
                console.log(data);  // Tarkistetaan, että saadaan oikea data ja mitä saadaan ja sen perusteella näen mitä tarvitsen 
                displaySchedules(data);  // Siirretään data suoraan displaySchedules-funktioon
            })
            .catch(error => {
                console.error('Error:', error); // Virheilmoitus konsoliin
                alert("Tapahtui virhe datan haussa."); // Virheilmoitus käyttäjälle
            });
    }

    // Näytetään aikataulut
    function displaySchedules(data) {

        // Asemien nimet lyhenteistä ymmärrettäviksi
        const stationNames = {
            'HKI': 'Helsinki',
            'TPE': 'Tampere',
            'TKU': 'Turku',
            'LR': 'Lappeenranta',
            'JNS': 'Joensuu',
            'JY': 'Jyväskylä',
            'OL': 'Oulu',
            'KOK': 'Kokkola',
            'LPV': 'Leppävaara',
            'KLH': 'Kauklahti',
            'KKN': 'Kirkkonummi',
            'LEN': 'Helsinki-Vantaan lentoasema',
            'KE': 'Kerava',
            'RI': 'Riihimäki',
            'LH': 'Lahti',
            'ILR': 'Ilmalan varikko',
            'KAJ': 'Kajaani',
            'MI': 'Mikkeli',
            'ROI': 'Rovaniemi',
            'KJÄ': 'Kemijärvi',
            'IMR': 'Imatra',
            'TUS': 'Turun satama',
            'LRS': 'Lauritsala',
            'KVLA': 'Kouvola',
            'KUO': 'Kuopio',
            'KUT': 'Kupittaa',
            'RSU': 'Ruokosuo',
            'HGS': 'Hangonsaari',
            'VS': 'Vaasa',
            'PM': 'Pieksämäki',
            'KEU': 'Keuruu',
            'KLI': 'Kolari',
            'SK': 'Seinäjoki',
            'VSA': 'Vuosaari',
            'PMT': 'Pieksamäki tavara',
            'ÄKI': 'Äänekoski',
            'ILM': 'Iisalmi',
            'KTP': 'Keitelepohja',
            'KEM': 'Kemi',
            'KON': 'Kontiomäki',
            'PTG': 'Patokangas',
            'SHS': 'Sahansaari',
            'JTS': 'Joutseno',
            'NRM': 'Nurmes',
            'UIM': 'Uimaharju',
            'VNS': 'Vainikkala',
            'ALH': 'Alholma',
            'YV': 'Ylivieska',
            'NOK': 'Oulu Nokela',
            'OLT': 'Oulu tavara',
        }

        scheduleList.innerHTML = '';  // Tyhjennetään aiempi sisältö

        // Tarkistetaan onko data tyhjä
        if (data.length === 0) {
            scheduleList.innerHTML = '<li>Ei aikatauluja saatavilla valitussa asemassa.</li>';
            return;
        }

        // Käydään data läpi ja luodaan lista junista
        data.forEach(train => {
            const trainNumber = train.trainNumber;

            //Haetaan junan lähtöasema ja saapumisasema
            const departureStationCode = train.timeTableRows[0].stationShortCode;
            const destinationStationCode = train.timeTableRows[train.timeTableRows.length - 1].stationShortCode;

            const departureStation = stationNames[departureStationCode] || departureStationCode;
            const destinationStation = stationNames[destinationStationCode] || destinationStationCode;

            // Haetaan junan kirjainlyhenne
            const trainType = train.trainType;

            // Haetaan paikallisjunan numero
            const commuterLineID = train.commuterLineID ? train.commuterLineID : '-';

            // Tarkistetaan lähtö- ja saapumisajat tietystä asemasta
            const departureRow = train.timeTableRows.find(row => row.stationShortCode === stationSelect.value && row.type === 'DEPARTURE');
            const arrivalRow = train.timeTableRows.find(row => row.stationShortCode === stationSelect.value && row.type === 'ARRIVAL');

            // Muodostetaan lähtö- ja saapumisajat tietylle asemalle
            const departureTime = departureRow ? new Date(departureRow.scheduledTime).toLocaleTimeString() : 'Tietoa ei saatavilla';
            const arrivalTime = arrivalRow ? new Date(arrivalRow.scheduledTime).toLocaleTimeString() : 'Tietoa ei saatavilla';

            // Oletetaan junan olevan aikataulussa, jos aikataulutietoja ei ole saatavilla
            let differenceInMinutes = 'Aikataulussa';
            let statusClass = 'on-time';

            // Tarkistetaan myöhästymistilanne ja lasketaan ero minuutteina valittuun asemaan
            if (departureRow && departureRow.actualTime && departureRow.scheduledTime) {
                const timeDifference = (new Date(departureRow.actualTime) - new Date(departureRow.scheduledTime)) / 60000;
                if (timeDifference > 0) {
                    differenceInMinutes = `Myöhässä ${Math.floor(timeDifference)} minuuttia`;
                    statusClass = 'late';
                } else if (timeDifference < 0) {
                    differenceInMinutes = `Etuajassa ${Math.abs(Math.floor(timeDifference))} minuuttia`;
                }
            }

            // Luodaan lista valitun aseman junasta ja sen tiedoista, joita haluan esitettävän
            const li = document.createElement('li');
            li.className = statusClass;
            li.innerHTML =  `
            <h3> ${trainType} ${trainNumber}</h3>
            
            <p>Reitti:<strong> ${departureStation} - ${destinationStation}</strong></p>
            <p>Paikallisjuna: ${commuterLineID}</p>

            <p>Lähtöaika: ${departureTime}</p>
            <p>Saapumisaika: ${arrivalTime}</p>

            <p>${differenceInMinutes}</p>
        `;
        // Lisätään lista aikatauluista
        scheduleList.appendChild(li);
    });
}
});
       
