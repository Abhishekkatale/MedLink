import { initializeApp } from "firebase/app";
import {getFirestore} from "@firebase/firestore";
const firebaseConfig = {

    apiKey: "AIzaSyDp_kGYKB-fM-rUUq9H-shmTXsoe0Ojp4w",
  
    authDomain: "medlink-57d8c.firebaseapp.com",
  
    projectId: "medlink-57d8c",
  
    storageBucket: "medlink-57d8c.firebasestorage.app",
  
    messagingSenderId: "733625365297",
  
    appId: "1:733625365297:web:731ebbfac3b6cd97153610"
  
  };
  const app = initializeApp(firebaseConfig);    
  const firestore = getFirestore(app);
  
  