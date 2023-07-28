

jQuery(document).ready(async function($){
    // init apis
    initAPIs();

    // init stopwatch
    initStopwatch();

    // jQuery.when(jQuery(document).trigger('indexDBGetAllEntries')).then(function(entries){
    //     console.log('entries');
    //     console.table(entries);
    // });

    // init submit form
    jQuery(document).on('submit', 'form[name="storerun"]', function(e){
        e.preventDefault();

        // let formData = new FormData(this);

        // formData.append('timestamp', new Date(jQuery.now()));
        
        // console.table([...formData]);

        // // prepare the entry
        // let entry = {};
        // formData.forEach((k,v) => {
        //     entry[k] = v;
        // });

        let distance = getRunDistance();

        // prepare the entry
        let entry = {
            'distance' : distance,
            'start' : stopwatchStarted,
            'end' : stopwatchEnded,
            'timestamp' : new Date(jQuery.now()),
        };


        // clear data
        positions = [];
        stopwatchStarted = null;
        stopwatchEnded = null;

        // hide form to prevent resubmitting
        jQuery(this).addClass('d-none');

        jQuery(document).trigger('indexDBStoreEntry', [entry]);
    });

    jQuery(document).on('click', '.start-tracking:not([disabled])', function(e){
        // recenter map
        jQuery(document).trigger('geolocationPinglocation', [
            function(GeolocationPosition){
                // recenter map
                jQuery(document).trigger('leafletRecenterMap', [GeolocationPosition.coords.latitude, GeolocationPosition.coords.longitude]);
    
                // // start watching location
                // jQuery(document).trigger('geolocationwatchPosition', glUpdatePosition);
            }
        ]);

        // start watching location
        jQuery(document).trigger('geolocationwatchPosition', glUpdatePosition);
    });

    jQuery(document).on('click', '.start-tracking:not([disabled])', function(e){
        jQuery('form[name="storerun"]').addClass('d-none');
    });
    jQuery(document).on('click', '.start-tracking[data-action="restart"]:not([disabled])', function(e){
        jQuery('form[name="storerun"] [name="distance"]').val(null);
        jQuery('form[name="storerun"] [name="time"]').val(null);
    });

    jQuery(document).on('click', '.stop-tracking:not([disabled])', function(e){
        // stop watching location
        jQuery(document).trigger('geolocationStopwatchPosition');
        
        // allow storing
        jQuery('form[name="storerun"]').removeClass('d-none');

        jQuery('form[name="storerun"] [name="distance"]').val(getRunDistance());
        jQuery('form[name="storerun"] [name="time"]').val(secondsToTime(stopwatchTime));
    });



    // init edport database
    jQuery(document).on('click', '.export_database', async function(e){
        e.preventDefault();

        jQuery.when(jQuery(document).trigger('indexDBGetAllEntries')).then(async function(e, data='Asd'){
            console.log('export_database', e, data);

            let cursor = e.target.result;
            if (cursor) {
                let key = cursor.primaryKey;
                let value = cursor.value;
                console.log(key, value);
                cursor.continue();
            }
            else {
                // no more results
            }

            data = 'asfd';

            const options = {
                types: [
                    {
                        description: 'Backup-Export of TrackApp-Database',
                        accept: {
                            // "text/plain": [".txt"],
                            'application/json' : ['.json'],
                        },
                    },
                ],
            };
            
            const handle = await window.showSaveFilePicker(options);
            const writable = await handle.createWritable();
            
            await writable.write(data);
            await writable.close();
        });

    });

});

// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

var stopwatchStarted = null;
var stopwatchEnded = null;
var stopwatchTime = 0;
var stopwatchInterval = null;
var stopwatchInterfaceInterval = null;

function initStopwatch(){
    // init start stopwatch btn
    jQuery(document).on('click', '.start-tracking:not([disabled])', function(e){

        // allow stopping
        jQuery('.stop-tracking').prop('disabled', false);
        // prevent restarting
        jQuery('.start-tracking').prop('disabled', 'disabled');

        let restart = false;
        switch( jQuery(this).attr('data-action') ){
            case 'start':
                break;

            case 'restart':
                restart = true;

                break;

            default:

        }

        // start stopwatch
        startStopWatch(restart);
    });

    // init stop stopwatch btn
    jQuery(document).on('click', '.stop-tracking:not([disabled])', function(e){
        // allow starting
        jQuery('.stop-tracking').prop('disabled', 'disabled');
        jQuery('.start-tracking').prop('disabled', false);

        // stop stopwatch
        stopStopWatch(1);
    });
}

/**
 * Start the stopwatch
 * 
 * @param {Boolean} restart (optional) if counter should be resetted. Default: false
 */
function startStopWatch(restart=false){
    stopStopWatch();

    if( restart ){
        stopwatchTime = 0;
        stopwatchEnded = null;
        stopwatchStarted = jQuery.now();
    }

    // restart
    stopwatchInterval = setInterval(function(){
        stopwatchTime++;
    }, 1000);
    stopwatchInterfaceInterval = setInterval(function(){
        jQuery('.stop-watch').html(secondsToTime(stopwatchTime));
    }, 1000);

    return true;
}

/**
 * Stop the stopwatch
 */
function stopStopWatch(){
    // tidy up
    if( stopwatchInterval ){
        clearInterval(stopwatchInterval);
        stopwatchInterval = false;
    }
    if( stopwatchInterfaceInterval ){
        clearInterval(stopwatchInterfaceInterval);
        stopwatchInterfaceInterval = false;
    }

    stopwatchEnded = jQuery.now();

    return true;
}

function secondsToTime(s){
    d = (Math.floor(s / 86400) + '').padStart(2, '0');
    s -= d * 86400;

    h = (Math.floor(s / 3600) + '').padStart(2, '0');
    s -= h * 3600;

    i = (Math.floor(s / 60) + '').padStart(2, '0');
    s -= i * 60;

    s = (s + '').padStart(2, '0');

    return `${d}:${h}:${i}:${s}`;
}

// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

/**
 * Logs errors if an API could not be inited
 * 
 * @param {String} api name of the API
 * 
 * @return {true}
 */
function logAPIInitError(api){
    console.error(`Could not init '${api}'`)
}
/**
 * Init all APIs
 * 
 * @returns {true}
 */
async function initAPIs(){
    // init usage of Geolocation API if available
    if( initAPIIndexedDB () ){

    }else{
        logAPIInitError('IndexedDB');
    }

    // init Leaflet
    if( initLeaflet() ){
        initLeafletCustom();
    }else{
        logAPIInitError('Leaflet');
    }

    // init usage of Geolocation API if available
    if( initAPIGeolocation() ){
        initAPIGeolocationCustom();
    }else{
        logAPIInitError('geolocationAPI');
    }

    return true;
}

// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

var positions = [];
var pos = {};

/**
 * Init custom usage of GeolocationAPI
 * @returns {true}
 */
function initAPIGeolocationCustom(){
    // create call to ensure that Geolocation API-Permissions were given
    jQuery(document).trigger('geolocationPinglocation', [
        function(GeolocationPosition){
            // recenter map
            jQuery(document).trigger('leafletRecenterMap', [GeolocationPosition.coords.latitude, GeolocationPosition.coords.longitude]);

            // // start watching location
            // jQuery(document).trigger('geolocationwatchPosition', glUpdatePosition);
        }, 
        function(GeolocationPositionError){
            if ( GeolocationPositionError.PERMISSION_DENIED == GeolocationPositionError.code ) {
                console.error('Geolocation API - Permissions not granted');
            }
        }, 
        {
            maximumAge: Infinity,
            timeout:0
        }
    ]);

    return true;
}

/**
 * Default callback after successfull ping
 * 
 * @param {GeolocationPosition} position 
 * 
 * @return {boolean}
 */
function glUpdatePosition(position){
    pos.lat = position.coords.latitude;
    pos.long = position.coords.longitude;

    let lastPost = false;
    if( positions.length ){
        lastPost = positions[positions.length-1];
    }

    positions.push({
        lat : pos.lat,
        long : pos.long,
        time : Date.now(),
    });

    if( lastPost && lastPost.lat != position.lat && lastPost.long != position.long ){
        jQuery(document).trigger('leafletDrawMapMarker', [position.coords.latitude, position.coords.longitude]);
    }

    return true;
}

// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

function initLeafletCustom(){
    
}

function getDistance(origin, destination) {
    // return distance in meters
    var lon1 = toRadian(origin[1]),
        lat1 = toRadian(origin[0]),
        lon2 = toRadian(destination[1]),
        lat2 = toRadian(destination[0]);

    var deltaLat = lat2 - lat1;
    var deltaLon = lon2 - lon1;

    var a = Math.pow(Math.sin(deltaLat/2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(deltaLon/2), 2);
    var c = 2 * Math.asin(Math.sqrt(a));
    var EARTH_RADIUS = 6371;
    return c * EARTH_RADIUS * 1000;
}
function toRadian(degree) {
    return degree*Math.PI/180;
}

/**
 * Get the distance
 * 
 * @return float
 */
function getRunDistance(){
    let d = 0;

    for(let i=0; i < positions.length; i++){
        if( positions[i+1] ){
            d += getDistance([positions[i]['lat'], positions[i]['long']], [positions[i+1]['lat'], positions[i+1]['long']]);
        }
    }

    return d;

    // let distance = 0;
    // jQuery.each(markers, function(){
    //     let d = getDistance(origin, destination);
    //     distance += d;
    // });

    // return distance;
}

// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// --------------------------------- Leaflet ----------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var leafletMap = null;
/**
 * Init Leaflet
 * 
 * @returns {boolean}
 */
function initLeaflet(){
    // Creating map options
    var mapOptions = {
        center: [52.377956, 4.897070],
        zoom: 10,
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    };
    
    // Creating a map object
    leafletMap = new L.map('map', mapOptions);
    
    // Creating a Layer object
    var layer = new L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    
    // Adding layer to the map
    leafletMap.addLayer(layer);

    return true;
}

/**
 * Draw leafletMap marker
 * 
 * @param {Number} lat
 * @param {Number} long
 */
jQuery(document).on('leafletDrawMapMarker', document, function(e, lat, long){
    L.marker([lat, long]).addTo(leafletMap);
});

/**
 * Recenter leafletMap
 * 
 * @param {Number} lat
 * @param {Number} long
 */
jQuery(document).on('leafletRecenterMap', document, function(e, lat, long){
    leafletMap.panTo(new L.LatLng(lat, long));
});

// ----------------------------------------------------------------------------------------------------
// --------------------------------- Geolocation API --------------------------------------------------
// ----------------------------------------------------------------------------------------------------

var gelocationAPIWatchID = false;

/**
 * Init Geolocation API
 * 
 * @returns {boolean}
 */
function initAPIGeolocation(){

    // return if not available
    if( !( 'geolocation' in navigator) ) {
        return false;
    }

    return true;
}

// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

/**
 * Default callback after successfull ping
 * 
 * @param {GeolocationPosition} position 
 * 
 * @return {boolean}
 */
function pinglocationSuccessfull(position){
    return true;
}
/**
 * Default callback after no successfull ping
 * 
 * @param {GeolocationPositionError} error 
 * 
 * @return {boolean}
 */
function pinglocationError(error){
    console.error('pinglocationError', error);
    return true;
}
/**
 * Ping location
 * 
 * @param {CallableFunction} callbackSuccess (optional) callback on success. Default: false (pinglocationSuccessfull)
 * @param {CallableFunction} callbackError (optional) callback on error. Default: false (pinglocationError)
 * @param {Object|null} options (optional) options. Default: null
 */
jQuery(document).on('geolocationPinglocation', document, function(e, callbackSuccess=false, callbackError=false, options=null){
    callbackSuccess = ( callbackSuccess && 'function' == typeof callbackSuccess)? callbackSuccess : pinglocationSuccessfull;
    callbackError = ( callbackError && 'function' == typeof callbackError )? callbackError : pinglocationError;
    const defaultOptions = {
    };
    options = ( 'object' == typeof options )? jQuery.extend({}, defaultOptions, options) : defaultOptions;

    navigator.geolocation.getCurrentPosition(callbackSuccess, callbackError, options);
});


/**
 * Default callback after successfull watch
 * 
 * @param {GeolocationPosition} position 
 * 
 * @return {boolean}
 */
function watchpositionSuccessfull(position){
    jQuery(document).trigger('geolocationResetposition', [position.coords.latitude, position.coords.longitude]);

    return true;
}
/**
 * Default callback after no successfull watch
 * 
 * @param {GeolocationPositionError} error 
 * 
 * @return {boolean}
 */
function watchpositionError(error){
    console.error('watchpositionError', error);

    // if( gelocationAPIWatchID ){
    //     // clear watching
    //     navigator.geolocation.clearWatch(gelocationAPIWatchID);
        gelocationAPIWatchID = false;
    // }

    /**
     * error.message:
     * 1: PERMISSION_DENIED
     * 2: POSITION_UNAVAILABLE
     * 3: TIMEOUT
     */
    if( error.PERMISSION_DENIED == error.message || error.POSITION_UNAVAILABLE == error.message ){
        return false;
    }

    jQuery(document).trigger('geolocationwatchPosition')

    return true;
}
/**
 * Start watching if no watch already started
 * Sets gelocationAPIWatchID
 * 
 * @param {CallableFunction} callbackSuccess (optional) callback on success. Default: watchpositionSuccessfull
 * @param {CallableFunction} callbackError (optional) callback on error. Default: watchpositionError
 * @param {Object|null} options (optional) options. Default: null
 * 
 */
jQuery(document).on('geolocationwatchPosition', function(e, callbackSuccess=watchpositionSuccessfull, callbackError=watchpositionError, options=null){
    if( gelocationAPIWatchID ){
        return false;
    }

    // callbackSuccess = ( callbackSuccess && 'function' == typeof callbackSuccess)? callbackSuccess : pinglocationSuccessfull;
    // callbackError = ( callbackError && 'function' == typeof callbackError )? callbackError : pinglocationError;

    const defaultOptions = {
        enableHighAccuracy: true,
        maximumAge: 5000,   // 30000,
        timeout: 4700,  // 27000,
    };
    options = ( 'object' == typeof options )? jQuery.extend({}, defaultOptions, options) : defaultOptions;

    gelocationAPIWatchID = navigator.geolocation.watchPosition(callbackSuccess, callbackError, options);
});


jQuery(document).on('geolocationStopwatchPosition', function(e){
    if( gelocationAPIWatchID ){
        // clear watching
        navigator.geolocation.clearWatch(gelocationAPIWatchID);
        gelocationAPIWatchID = false;
    }
});


// ----------------------------------------------------------------------------------------------------
// --------------------------------- IndexedDB --------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

const dbname = 'trackappdemo';
const dbversion = 1;

const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
// const db = await initDb();
var db = null;

/**
 * Init IndexedDB
 * 
 * @returns {boolean}
 */
async function initAPIIndexedDB(){
    if( !indexedDB ){
        return false;
    }

    /**
     * Init new db
     * @returns Promise
     */
    async function initDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbname, dbversion);
    
            // connecting-error
            request.onerror = (e) => {
                console.error('IndexDb not allowed', e);
                reject(e);
            };

            // alter table structure
            request.onupgradeneeded = (e) => {
                db = e.target.result;

                /**
                 * entry-object
                 * {
                 *  'distance' : '',
                 *  'start' : '',
                 *  'end' : '',
                 *  'time' : '',
                 * }
                 */

                /**
                 * @todo epre* ssn better key
                 */
                //  main object
                let store = db.createObjectStore("entry", {keyPath: 'id', autoIncrement: true});

                // index
                store.createIndex("id", "id", { unique: true });
                store.createIndex("distance", "distance", { unique: false });
                store.createIndex("start", "start", { unique: false });
                store.createIndex("end", "end", { unique: false });
                store.createIndex("time", "time", { unique: false });
                store.createIndex("timestamp", "timestamp", { unique: false });

            };

            // connecting-success
            request.onsuccess = (event) => {
                return resolve(event.target.result);
                // return db = event.target.result;
            };
        });
    }

    /**
     * Store a new entry
     * @param {Object} entry  @see initDb() for definition
     * @param {Boolean} ioa if INSERT OR UPDATE or INSERT Default: true (INSERT OR UPDATE)
     * @returns Promise
     */
    function storeEntry(entry, ioa=true){
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('entry', 'readwrite');
            const store = transaction.objectStore("entry");

            transaction.oncomplete = (e) => {
                resolve(e);
            };
            
            transaction.onerror = (err) => {
                reject(err);
            };
            
            if( ioa ){
                store.put(entry);   // INSERT OR UPDATE
            }else{
                store.add(entry);    // INSERT
            }
        });
    }

    /**
     * Get all entires
     * @returns Promise
     */
    function getAllEntries(){
        return new Promise((resolve, reject) => {
            // if( !db ){
            //     db = initDb
            // }
            const transaction = db.transaction('entry', 'readonly');
            const store = transaction.objectStore("entry");

            let query = store.getAll();
            query.onsuccess = (e) => {
                resolve(e.target.result);
            };

            query.onerror = (err)=> {
                reject(err);
            }
        });
    }
    
    /**
     * Get all entires
     * @param {Int} limit (optional) Default: 20
     * @param {Int} offset (optional) Default: 0
     * @returns Promise
     */
    function getEntries(limit=20, offset=0){
        /**
         * Search-criteria
         */
        let query = null;   // key or IDBKeyRange. If null: keyPath
        let direction = 'prev'; // 'prev' if DESC. 'next' if ASC. Default: 'next'. (nextunique, prevunique)
        // direction = 'next';
        let indexName = 'id';   // index after which to order. Has to be declared in initDB()

        return new Promise((resolve, reject) => {
            const results = [];
            const transaction = db.transaction('entry', 'readonly');
            transaction.oncomplete = event => resolve(results);
            transaction.onerror = event => reject(event.target);
            const store = transaction.objectStore('entry');
            const index = store.index(indexName);
            const request = index.openCursor(query, direction);
        
            let advanced = offset === 0;
            let counter = 0;
            
            request.onsuccess = event => {
            const cursor = event.target.result;
            if (!cursor) {
                return;
            }

            if (!advanced) {
                advanced = true;
                cursor.advance(offset);
            }
        
            
            // only add not deleted
            if( 'false' == cursor.value.deleted ){
                counter++;
                results.push(cursor.value);
            }
        
            if (counter >= limit) {
                return;
            }
            cursor.continue();
            };
        });
    }
    
    function getEntry(key){
        const transaction = db.transaction('entry', 'readwrite');
        const store = transaction.objectStore("entry");
    
        const request = store.get(key);
    
        request.onsuccess = ()=> {
            return request.result;
        }
        request.onerror = (err)=> {
            console.log(err);
        }
    }

    /**
     * Delete an entry
     * @param {Int} id 
     * @returns Promise
     */
    function deleteEntry(id){

        return new Promise((resolve, reject) => {
            getEntry(id).then(function(entry){
                // already deleted
                if( 'true' == entry.deleted ){
                    reject('already deleted');
                }

                entry.deleted = true;

                storeEntry(entry).then(function(e){
                    resolve(e);
                }).catch(function(err){
                    reject(err)
                });

            }).catch(function(err){
                reject(err)
            });
        });

        // true deletion
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('entry', 'readwrite');
            const store = transaction.objectStore("entry");

            transaction.oncomplete = (e) => {
                resolve(e);
            };
            
            transaction.onerror = (err) => {
                console.error('ERROR on deletion', err)
                reject(err);
            };
            
            store.delete(+id);
        });
    }

    /**
     * Get an Entry by id
     * @param {*} id 
     * @returns Promise
     */
    function getEntry(id){
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('entry', 'readonly');
            const store = transaction.objectStore('entry');

            // +id not just id because of Int-String-Index Problerms
            const request = store.get(+id);
            request.onsuccess = (e) => {
                if( undefined == e ){
                    reject(e);
                }
                resolve(request.result);
            };

            request.onerror = (err)=> {
                reject(err);
            }
        });
    }

    /**
     * Clear whole db
     * HANDLE WITH CARE
     * 
     * @returns Promise
     */
    function clearDatabase(){
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('entry', 'readwrite');
            const store = transaction.objectStore('entry');

            const request = store.clear();
            request.onsuccess = (e) => {
                resolve(e);
            };

            request.onerror = (err)=> {
                reject(err);
            }
        });

    }
    
    
    jQuery(document).on('indexDBGetAllEntries', async function(e){
        entries = await getAllEntries();
        console.log('indexDBGetAllEntries', entries);
        return entries
    });

    jQuery(document).on('indexDBGetEntry', async function(e, key){
        return await getEntry(key);
    });

    jQuery(document).on('indexDBDeleteEntry', async function(e, key){
        return await deleteEntry(key);
    });
    
    jQuery(document).on('indexDBStoreEntry', async function(e, entry){
        return await storeEntry(entry);
    });

    // jQuery(document).on('indexDBclearDatabase', async function(e){
    //     return await clearDatabase();
    // });

    // init database
    db = await initDb();
    // jQuery.when(jQuery(document).trigger('indexDBGetDatabase')).when(function(database){
    //     const db = database;
    // });
    // jQuery(document).on('indexDBGetDatabase', async function(e){
    //     return await initDb();
    // });

    return true;
}

// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
