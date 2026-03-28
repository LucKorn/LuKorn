import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E14" />
      <Text style={styles.titulo}>MEUS TREINOS V43</Text>
      <View style={styles.card}>
        <Text style={styles.texto}>ESTRUTURA VALIDADA! ✅</Text>
        <Text style={styles.subtexto}>O build passou e a Splash Screen funcionou.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0A0E14', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 20 
  },
  titulo: { 
    color: '#00FF00', 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  card: { 
    backgroundColor: '#1A1F26', 
    padding: 25, 
    borderRadius: 15, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333'
  },
  texto: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold',
    textAlign: 'center' 
  },
  subtexto: { 
    color: '#AAA', 
    fontSize: 14, 
    marginTop: 10,
    textAlign: 'center'
  }
});
