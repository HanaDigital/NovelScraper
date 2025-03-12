// Import the functions you need from the SDKs you need
import { getApp, initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyDmHmPpqOY8PXVDab5GkHPmjbiyM3DuCa4",
	authDomain: "novelscraper-hanadigital.firebaseapp.com",
	projectId: "novelscraper-hanadigital",
	storageBucket: "novelscraper-hanadigital.firebasestorage.app",
	messagingSenderId: "698338432734",
	appId: "1:698338432734:web:8138abc973456dc95ed44f",
	measurementId: "G-9B28PNQTL4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const getFirebaseAnalytics = () => getAnalytics(app);
