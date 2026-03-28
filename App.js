import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E14" />
      <Text style={styles.titulo}>MEUS TREINOS V43</Text>
      <View style={styles.card}>
        <Text style={styles.texto}>O App abriu com sucesso!</Text>
        <Text style={styles.subtexto}>Agora vamos colocar as funções de volta uma por uma.</Text>
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
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  card: { 
    backgroundColor: '#1A1F26', 
    padding: 20, 
    borderRadius: 15, 
    alignItems: 'center' 
  },
  texto: { 
    color: '#FFF', 
    fontSize: 18, 
    textAlign: 'center' 
  },
  subtexto: { 
    color: '#666', 
    fontSize: 14, 
    marginTop: 10 
  }
});
