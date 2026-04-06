import React, { useState, useEffect, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useKeepAwake } from 'expo-keep-awake'; // Impede a hibernação
import { 
  StyleSheet, Text, View, TouchableOpacity, FlatList, 
  TextInput, ScrollView, Modal, Vibration, Dimensions, SafeAreaView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Mantém a splash screen visível até o app carregar
SplashScreen.preventAutoHideAsync();

export default function App() {
  // Ativa o recurso para a tela não desligar durante o treino
  useKeepAwake();

  const [appPronto, setAppPronto] = useState(false);
  const [tema, setTema] = useState('light');
  const [treinoAtivo, setTreinoAtivo] = useState(null);
  const [tela, setTela] = useState('menu');
  const [mesAtual, setMesAtual] = useState(new Date());
  
  // Estados principais baseados no seu print
  const [appTitle, setAppTitle] = useState('TREINO RCHOP');
  const [tempoDescanso, setTempoDescanso] = useState(180); 
  const [exercicios, setExercicios] = useState({});
  const [historico, setHistorico] = useState([]);

  // Estados do Cronômetro
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const timerRef = useRef(null);

  // Estados de Input
  const [novoTreinoNome, setNovoTreinoNome] = useState('');

  const Cores = {
    bg: tema === 'light' ? '#F2F2F7' : '#0A0A0A',
    card: tema === 'light' ? '#FFFFFF' : '#1C1C1E',
    texto: tema === 'light' ? '#1C1C1E' : '#FFFFFF',
    azulDestaque: '#007AFF', // Cor da bordinha lateral
    danger: '#FF4D4F',
    sub: '#8E8E93',
    botaoAdd: '#3A506B'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const d = await AsyncStorage.getItem('@gym_v55_data');
      const h = await AsyncStorage.getItem('@gym_v55_hist');
      const t = await AsyncStorage.getItem('@gym_v55_desc');
      if (d) setExercicios(JSON.parse(d));
      if (h) setHistorico(JSON.parse(h));
      if (t) setTempoDescanso(parseInt(t));
    } catch (e) {
      console.log("Erro ao carregar", e);
    } finally {
      setAppPronto(true);
      await SplashScreen.hideAsync();
    }
  };

  const saveData = async (newEx, newHist, newDesc) => {
    try {
      await AsyncStorage.setItem('@gym_v55_data', JSON.stringify(newEx));
      await AsyncStorage.setItem('@gym_v55_hist', JSON.stringify(newHist));
      await AsyncStorage.setItem('@gym_v55_desc', newDesc.toString());
    } catch (e) {
      console.log("Erro ao salvar", e);
    }
  };

  const adicionarTreino = () => {
    if (novoTreinoNome.trim() === '') return;
    const novos = { ...exercicios, [novoTreinoNome]: [] };
    setExercicios(novos);
    setNovoTreinoNome('');
    saveData(novos, historico, tempoDescanso);
  };

  const excluirTreino = (nome) => {
    const novos = { ...exercicios };
    delete novos[nome];
    setExercicios(novos);
    saveData(novos, historico, tempoDescanso);
  };

  // Funções do Cronômetro
  const iniciarTimer = () => {
    Vibration.vibrate(50);
    setSegundos(tempoDescanso);
    setTimerAtivo(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSegundos((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerAtivo(false);
          Vibration.vibrate([500, 500, 500]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!appPronto) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Cores.bg }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        <Text style={[styles.headerTitle, { color: Cores.texto }]}>{appTitle}</Text>

        <TouchableOpacity style={styles.btnHistorico}>
          <Text style={styles.btnHistoricoTexto}>📜 VER HISTÓRICO</Text>
        </TouchableOpacity>

        <View style={[styles.stepperContainer, { backgroundColor: Cores.card }]}>
          <Text style={styles.stepperLabel}>DESCANSO PADRÃO</Text>
          <View style={styles.stepperControls}>
            <TouchableOpacity onPress={() => setTempoDescanso(prev => Math.max(10, prev - 10))}>
              <Text style={styles.stepperBtn}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.stepperValue, { color: Cores.texto }]}>{tempoDescanso}s</Text>
            <TouchableOpacity onPress={() => setTempoDescanso(prev => prev + 10)}>
              <Text style={styles.stepperBtn}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {Object.keys(exercicios).map((item, index) => (
          <View key={index} style={[styles.cardTreino, { backgroundColor: Cores.card, borderLeftColor: Cores.azulDestaque }]}>
            <Text style={[styles.treinoNome, { color: Cores.texto }]}>{item}</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={iniciarTimer} style={styles.btnPlay}>
                <Text style={{ fontSize: 20 }}>▶️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => excluirTreino(item)}>
                <Text style={{ fontSize: 20 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TextInput
          style={[styles.input, { backgroundColor: Cores.card, color: Cores.texto }]}
          placeholder="Novo treino..."
          placeholderTextColor={Cores.sub}
          value={novoTreinoNome}
          onChangeText={setNovoTreinoNome}
        />

        <TouchableOpacity style={[styles.btnAdd, { backgroundColor: Cores.botaoAdd }]} onPress={adicionarTreino}>
          <Text style={styles.btnAddTexto}>+ ADICIONAR TREINO</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ marginTop: 30, alignItems: 'center' }}
          onPress={() => setTema(tema === 'light' ? 'dark' : 'light')}
        >
          <Text style={{ color: Cores.sub }}>ALTERNAR TEMA ☀️/🌙</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal do Cronômetro */}
      <Modal visible={timerAtivo} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.timerTexto}>{segundos}s</Text>
            <Text style={styles.timerSub}>Descansando...</Text>
            <TouchableOpacity 
              style={styles.btnFecharTimer} 
              onPress={() => { setTimerAtivo(false); clearInterval(timerRef.current); }}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>PARAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginVertical: 30, letterSpacing: 1 },
  btnHistorico: { backgroundColor: '#E9ECF2', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  btnHistoricoTexto: { color: '#3A506B', fontWeight: 'bold', fontSize: 16 },
  stepperContainer: { padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 25 },
  stepperLabel: { fontSize: 12, color: '#8E8E93', fontWeight: 'bold', marginBottom: 5 },
  stepperControls: { flexDirection: 'row', alignItems: 'center' },
  stepperBtn: { fontSize: 35, color: '#3A506B', paddingHorizontal: 25 },
  stepperValue: { fontSize: 32, fontWeight: '800', minWidth: 100, textAlign: 'center' },
  cardTreino: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 15,
    borderLeftWidth: 8, // Bordinha azul lateral
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  treinoNome: { fontSize: 18, fontWeight: '600', flex: 1 },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  btnPlay: { marginRight: 20, padding: 5 },
  input: { padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15, marginTop: 10 },
  btnAdd: { padding: 18, borderRadius: 12, alignItems: 'center' },
  btnAddTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { alignItems: 'center' },
  timerTexto: { fontSize: 100, fontWeight: '900', color: '#FFF' },
  timerSub: { fontSize: 20, color: '#007AFF', fontWeight: 'bold', marginTop: -10, marginBottom: 40 },
  btnFecharTimer: { backgroundColor: '#FF4D4F', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 }
});
