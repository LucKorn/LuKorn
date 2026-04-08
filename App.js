import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, ScrollView, 
  SafeAreaView, StatusBar, Alert, Appearance 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [ordemTreinos, setOrdemTreinos] = useState(['Treino A', 'Treino B', 'Treino C']);
  const [historico, setHistorico] = useState([]);
  const [segundos, setSegundos] = useState(0);
  const [isAtivo, setIsAtivo] = useState(false);
  const timerRef = useRef(null);

  // Paleta de Cores Adaptável (Sempre com tons de Azul, nunca Verde)
  const tema = {
    fundo: isDarkMode ? '#0A0E14' : '#F5F7FA',
    card: isDarkMode ? '#161B22' : '#FFFFFF',
    texto: isDarkMode ? '#FFFFFF' : '#1F2328',
    subTexto: isDarkMode ? '#8B949E' : '#57606A',
    azulDestaque: '#2F81F7',
    azulBotao: '#1F6FEB',
    borda: isDarkMode ? '#30363D' : '#D0D7DE',
  };

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (isAtivo) {
      activateKeepAwake();
      timerRef.current = setInterval(() => setSegundos(s => s + 1), 1000);
    } else {
      deactivateKeepAwake();
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isAtivo]);

  const carregarDados = async () => {
    try {
      const [ordem, hist, t] = await Promise.all([
        AsyncStorage.getItem('@gym_v43_order'),
        AsyncStorage.getItem('@gym_v43_history'),
        AsyncStorage.getItem('@gym_v43_theme')
      ]);
      if (ordem) setOrdemTreinos(JSON.parse(ordem));
      if (hist) setHistorico(JSON.parse(hist));
      if (t) setIsDarkMode(t === 'dark');
    } catch (e) { console.log("Erro ao carregar"); }
  };

  const alternarTema = async () => {
    const novoTema = !isDarkMode;
    setIsDarkMode(novoTema);
    await AsyncStorage.setItem('@gym_v43_theme', novoTema ? 'dark' : 'light');
  };

  const finalizarTreino = async () => {
    const treinoFinalizado = ordemTreinos[0];
    const novaOrdem = [...ordemTreinos.slice(1), treinoFinalizado];
    const novoItemHist = { 
      treino: treinoFinalizado, 
      data: new Date().toLocaleDateString('pt-BR'), 
      tempo: formatarTempo(segundos) 
    };
    const novoHistorico = [novoItemHist, ...historico].slice(0, 15);

    setOrdemTreinos(novaOrdem);
    setHistorico(novoHistorico);
    setSegundos(0);
    setIsAtivo(false);
    
    await AsyncStorage.setItem('@gym_v43_order', JSON.stringify(novaOrdem));
    await AsyncStorage.setItem('@gym_v43_history', JSON.stringify(novoHistorico));
    Alert.alert("Concluído!", "Treino movido para o fim da fila.");
  };

  const formatarTempo = (s) => {
    const m = Math.floor(s / 60);
    const seg = s % 60;
    return `${m.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tema.fundo }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* HEADER COM BOTÃO DE TEMA */}
      <View style={[styles.header, { borderBottomColor: tema.borda }]}>
        <View>
          <Text style={[styles.titulo, { color: tema.texto }]}>GYM v43</Text>
          <Text style={{ color: tema.azulDestaque, fontSize: 12 }}>PROX: {ordemTreinos[0]}</Text>
        </View>
        <TouchableOpacity onPress={alternarTema} style={[styles.btnTema, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Text style={{ fontSize: 18 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* CRONÔMETRO */}
        <View style={[styles.cardDestaque, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Text style={[styles.timerDisplay, { color: tema.texto }]}>{formatarTempo(segundos)}</Text>
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: isAtivo ? '#F85149' : tema.azulBotao }]} 
              onPress={() => setIsAtivo(!isAtivo)}
            >
              <Text style={styles.btnTxt}>{isAtivo ? "PAUSAR" : "INICIAR"}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: tema.fundo, borderWidth: 1, borderColor: tema.borda }]} 
              onPress={() => setSegundos(0)}
            >
              <Text style={[styles.btnTxt, { color: tema.texto }]}>ZERAR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LISTA / FILA */}
        <Text style={[styles.secaoTitulo, { color: tema.subTexto }]}>Fila de Treinos</Text>
        {ordemTreinos.map((treino, index) => (
          <View key={treino} style={[styles.itemFila, { backgroundColor: tema.card, borderColor: index === 0 ? tema.azulDestaque : tema.borda }]}>
            <Text style={[styles.treinoNome, { color: tema.texto }]}>{index + 1}. {treino}</Text>
            {index === 0 && (
              <TouchableOpacity style={styles.btnOk} onPress={finalizarTreino}>
                <Text style={styles.btnOkTxt}>FINALIZAR</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* HISTÓRICO */}
        <Text style={[styles.secaoTitulo, { color: tema.subTexto, marginTop: 25 }]}>Histórico</Text>
        {historico.map((h, i) => (
          <View key={i} style={styles.itemHist}>
            <Text style={{ color: tema.texto }}>{h.treino} • {h.data}</Text>
            <Text style={{ color: tema.azulDestaque, fontWeight: 'bold' }}>{h.tempo}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  titulo: { fontSize: 24, fontWeight: 'bold' },
  btnTema: { padding: 8, borderRadius: 10, borderWidth: 1 },
  cardDestaque: { padding: 25, borderRadius: 15, alignItems: 'center', marginBottom: 25, borderWidth: 1 },
  timerDisplay: { fontSize: 60, fontWeight: '200', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12 },
  btn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, minWidth: 130, alignItems: 'center' },
  btnTxt: { color: '#FFF', fontWeight: 'bold' },
  secaoTitulo: { fontSize: 13, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase' },
  itemFila: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 18, borderRadius: 12, marginBottom: 10, borderWidth: 1
  },
  treinoNome: { fontSize: 16, fontWeight: '500' },
  btnOk: { backgroundColor: '#1F6FEB', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 6 },
  btnOkTxt: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  itemHist: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#30363D44' 
  }
});

