/* ==========================================================================
   Music catalogue — shared by Music on Mac and iPhone
   --------------------------------------------------------------------------
   Every recording URL was resolved through the Wikimedia Commons API and
   verified to play; the radio list is the verified fallback used when the
   open Radio Browser directory can't be reached.
   ========================================================================== */

const COMMONS = 'https://upload.wikimedia.org/wikipedia/commons/transcoded/';

const MUSIC_TRACKS = [
    {
        id: 'beethoven-moonlight', title: 'Moonlight Sonata (I. Adagio sostenuto)', artist: 'Ludwig van Beethoven',
        album: 'Piano Sonata No. 14', duration: 360, color: 'linear-gradient(135deg, #4a00e0, #8e2de2)', icon: 'fa-moon',
        playlist: 'classical',
        audioUrl: COMMONS + 'e/eb/Beethoven_Moonlight_1st_movement.ogg/Beethoven_Moonlight_1st_movement.ogg.mp3'
    },
    {
        id: 'mozart-symphony40', title: 'Symphony No. 40 (I. Molto allegro)', artist: 'Wolfgang Amadeus Mozart',
        album: 'Symphony No. 40 in G minor, K. 550', duration: 359, color: 'linear-gradient(135deg, #fa709a, #fee140)', icon: 'fa-feather-pointed',
        playlist: 'classical',
        audioUrl: COMMONS + 'a/a8/Mozart_-_Symphony_No._40_in_G_minor%2C_K550_-_I._Molto_allegro_%28Musopen_Symphony%29.flac/Mozart_-_Symphony_No._40_in_G_minor%2C_K550_-_I._Molto_allegro_%28Musopen_Symphony%29.flac.mp3'
    },
    {
        id: 'chopin-nocturne', title: 'Nocturne in E-flat major, Op. 9 No. 2', artist: 'Frédéric Chopin',
        album: 'Nocturnes, Op. 9', duration: 271, color: 'linear-gradient(135deg, #0ba360, #3cba92)', icon: 'fa-music',
        playlist: 'classical',
        audioUrl: COMMONS + '8/89/Chopin_-_Nocturne_No._2_in_E-flat_major%2C_Op._9_No._2_%28Frank_Levy%29.flac/Chopin_-_Nocturne_No._2_in_E-flat_major%2C_Op._9_No._2_%28Frank_Levy%29.flac.mp3'
    },
    {
        id: 'vivaldi-spring', title: 'The Four Seasons: Spring (I. Allegro)', artist: 'Antonio Vivaldi',
        album: 'Le quattro stagioni', duration: 215, color: 'linear-gradient(135deg, #ff0844, #ffb199)', icon: 'fa-sun',
        playlist: 'classical',
        audioUrl: COMMONS + 'f/ff/Vivaldi_-_Four_Seasons_1_Spring_mvt_1_Allegro_-_John_Harrison_violin.oga/Vivaldi_-_Four_Seasons_1_Spring_mvt_1_Allegro_-_John_Harrison_violin.oga.mp3'
    },
    {
        id: 'satie-gymnopedie', title: 'Gymnopédie No. 1', artist: 'Erik Satie',
        album: 'Trois Gymnopédies', duration: 172, color: 'linear-gradient(135deg, #13547a, #80d0c7)', icon: 'fa-cloud',
        playlist: 'classical',
        audioUrl: COMMONS + 'a/a6/Satie_Gymnopedie_No_1_performed_by_Michael_Laucke.flac/Satie_Gymnopedie_No_1_performed_by_Michael_Laucke.flac.mp3'
    },
    {
        id: 'debussy-clairdelune', title: 'Clair de Lune', artist: 'Claude Debussy',
        album: 'Suite bergamasque', duration: 304, color: 'linear-gradient(135deg, #667eea, #764ba2)', icon: 'fa-star',
        playlist: 'classical',
        audioUrl: COMMONS + 'b/be/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg.mp3'
    },
    {
        id: 'lofi-midnight', title: 'Midnight Code & Chill', artist: 'Generative · Web Audio',
        album: 'Late Night Developer Sessions', duration: 168, color: 'linear-gradient(135deg, #f857a6, #ff5858)', icon: 'fa-laptop-code',
        playlist: 'generative', audioUrl: null,
        synth: {
            bpm: 78, cutoff: 1500, swing: 0.12, drums: true, delay: 0.18,
            chords: [
                [130.81, 164.81, 196.00, 246.94],   // Cmaj7
                [110.00, 130.81, 164.81, 196.00],   // Am7
                [146.83, 174.61, 220.00, 261.63],   // Dm7
                [98.00, 123.47, 146.83, 174.61]     // G7
            ]
        }
    },
    {
        id: 'synthwave-neon', title: 'Retro Neon Drive 1984', artist: 'Generative · Web Audio',
        album: 'Cupertino Sunset Drive', duration: 195, color: 'linear-gradient(135deg, #00f2fe, #4facfe)', icon: 'fa-car-side',
        playlist: 'generative', audioUrl: null,
        synth: {
            bpm: 104, cutoff: 2600, swing: 0, drums: true, delay: 0.34, wave: 'sawtooth',
            chords: [
                [110.00, 130.81, 164.81],   // Am
                [87.31, 110.00, 130.81],    // F
                [130.81, 164.81, 196.00],   // C
                [98.00, 123.47, 146.83]     // G
            ]
        }
    }
];

// Verified-playing fallback stations (used if the directory is unreachable).
const RADIO_FALLBACK_STATIONS = {
    IN: [
        { id: 'in-gaane-purane', name: 'Bollywood Gaane Purane', desc: 'Classic Hindi film songs', country: 'India', streamUrl: 'https://stream.zeno.fm/6n6ewddtad0uv' },
        { id: 'in-mirchi-top20', name: 'Mirchi Top 20', desc: 'Current Bollywood hits', country: 'India', streamUrl: 'https://drive.uber.radio/uber/bollywoodnow/icecast.audio' },
        { id: 'in-mirchi-love', name: 'Mirchi Love', desc: 'Romantic Hindi songs', country: 'India', streamUrl: 'https://drive.uber.radio/uber/bollywoodlove/icecast.audio' },
        { id: 'in-hindi-gold', name: 'Hindi Gold Radio', desc: 'Evergreen Hindi classics', country: 'India', streamUrl: 'https://azuracast.vibesounds.in:8010/radio.mp3' },
        { id: 'in-bollywood-90s', name: 'Radio Bollywood 90s', desc: '90s Bollywood', country: 'India', streamUrl: 'https://stream.zeno.fm/rm4i9pdex3cuv' },
        { id: 'in-lata', name: 'Lata Mangeshkar Radio', desc: 'Songs of Lata Mangeshkar', country: 'India', streamUrl: 'https://stream.zeno.fm/87xam8pf7tzuv' }
    ],
    GLOBAL: [
        { id: 'radio-paradise', name: 'Radio Paradise', desc: 'Eclectic rock, world & acoustic · California', country: 'United States', streamUrl: 'https://stream.radioparadise.com/mp3-128' },
        { id: 'radio-paradise-mellow', name: 'Radio Paradise Mellow', desc: 'Chill, mellow mix', country: 'United States', streamUrl: 'https://stream.radioparadise.com/mellow-128' },
        { id: 'bbc-world-service', name: 'BBC World Service', desc: 'News & documentaries · London', country: 'United Kingdom', streamUrl: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service' },
        { id: 'classic-fm', name: 'Classic FM', desc: 'Classical · London', country: 'United Kingdom', streamUrl: 'https://media-ice.musicradio.com/ClassicFMMP3' },
        { id: 'dance-wave', name: 'Dance Wave!', desc: 'Dance & electronic', country: 'Hungary', streamUrl: 'https://dancewave.online/dance.mp3' }
    ]
};
const RADIO_STATION_COLORS = ['linear-gradient(135deg,#ff9933,#138808)', 'linear-gradient(135deg,#e11d48,#be123c)', 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    'linear-gradient(135deg,#0284c7,#0369a1)', 'linear-gradient(135deg,#059669,#047857)', 'linear-gradient(135deg,#d946ef,#a855f7)',
    'linear-gradient(135deg,#f59e0b,#b45309)', 'linear-gradient(135deg,#ec4899,#f43f5e)'];

window.MUSIC_TRACKS = MUSIC_TRACKS;
window.RADIO_FALLBACK_STATIONS = RADIO_FALLBACK_STATIONS;
window.RADIO_STATION_COLORS = RADIO_STATION_COLORS;
