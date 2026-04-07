import React, { useState, useEffect, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen'; 
import { useKeepAwake } from 'expo-keep-awake'; 
import { 
  StyleSheet, Text, View, TouchableOpacity, FlatList, 
  TextInput, ScrollView, Modal, Vibration, Dimensions, SafeAreaView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

SplashScreen.preventAutoHideAsync();

const ManterTelaAcesa = () => {
  useKeepAwake();
  return null;
};

export default function App() {
  const [appPronto, setAppPronto] = useState(false);
  const [tema, setTema] = useState('dark');
  const [treinoAtivo, setTreinoAtivo] = useState(null);
  const [exercicios, setExercicios] = useState({});
  const [historico, setHistorico] = useState([]);
  const [tela, setTela] = useState('menu');
  const [tempoDescanso, setTempoDescanso] = useState(60);
  const [novoTreinoNome, setNovoTreinoNome] = useState('');
  const [appTitle, setAppTitle] = useState('MEUS TREINOS');
  const [mesAtual, setMesAtual] = useState(new Date());

  const [timerAtivo, setTimerAtivo] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [tipoTimer, setTipoTimer] = useState('descanso'); 
  const timerRef = useRef(null);

  const Cores = {
    bg: tema === 'light' ? '#F2F2F7' : '#0A0A0A',
    card: tema === 'light' ? '#FFFFFF' : '#1C1C1E',
    texto: tema === 'light' ? '#1C1C1E' : '#FFFFFF',
    destaque: '#3A506B', 
    sub: '#8E8E93',
    stepperBg: tema === 'light' ? '#F0F0F0' : '#2C2C2E',
    danger: '#FF4D4F'
  };

  useEffect(() => {
    const load = async () => {
      try {
        const d = await AsyncStorage.getItem('@gym_v54_data');
        const h = await AsyncStorage.getItem('@gym_v54_hist');
        const t = await AsyncStorage.getItem('@gym_v54_desc');
        const title = await AsyncStorage.getItem('@gym_v54_title');
        const savedTheme = await AsyncStorage.getItem('@gym_v54_theme');
        if (d) setExercicios(JSON.parse(d));
        if (h) setHistorico(JSON.parse(h));
        if (t) setTempoDescanso(parseInt(t));
        if (title) setAppTitle(title);
        if (savedTheme) setTema(savedTheme);
      } catch (e) { console.log(e); } finally {
        setAppPronto(true);
        await SplashScreen.hideAsync();
      }
    };
    load();
  }, []);

  const save = async (d, h, t, title, th) => {
    if (d) await AsyncStorage.setItem('@gym_v54_data', JSON.stringify(d));
    if (h) await AsyncStorage.setItem('@gym_v54_hist', JSON.stringify(h));
    if (t) await AsyncStorage.setItem('@gym_v54_desc', t.toString());
    if (title) await AsyncStorage.setItem('@gym_v54_title', title);
    if (th) await AsyncStorage.setItem('@gym_v54_theme', th);
  };

  const rodarTimer = (t, tipo = 'descanso') => {
    setTipoTimer(tipo);
    setSegundos(t); 
    setTimerAtivo(true);
    if(timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSegundos(s => {
      if(s <= 1){ 
        clearInterval(timerRef.current); 
        setTimerAtivo(false); 
        Vibration.vibrate([0, 500, 200, 500]); 
        return 0; 
      }
      return s - 1;
    }), 1000);
  };

  const finalizarTreino = () => {
    const listaAtual = exercicios[treinoAtivo];
    const volume = listaAtual.reduce((a, e) => a + (e.feitas * e.rep * e.carga), 0);
    const agora = new Date();
    const pendentes = listaAtual.filter(e => e.feitas === 0);
    const concluidos = listaAtual.filter(e => e.feitas > 0).map(e => ({...e, feitas: 0}));
    const novaListaEx = [...pendentes, ...concluidos];
    const nH = [{ id: Date.now().toString(), treino: treinoAtivo, volume, dataStr: agora.toLocaleDateString('pt-BR'), timestamp: agora.getTime() }, ...historico];
    
    const { [treinoAtivo]: _, ...restante } = exercicios;
    const nE = { ...restante, [treinoAtivo]: novaListaEx };

    setHistorico(nH); setExercicios(nE); save(nE, nH); setTela('menu');
    Vibration.vibrate(200);
  };

  // NOVA FUNÇÃO: Remover item específico do histórico
  const removerItemHistorico = (id) => {
    const novoH = historico.filter(h => h.id !== id);
    setHistorico(novoH);
    save(null, novoH);
    Vibration.vibrate(50);
  };

  const Stepper = ({ label, val, onMin, onAdd }) => (
    <View style={{alignItems: 'center', flex: 1}}>
      <Text style={[styles.stepLabel, {color: Cores.sub}]}>{label}</Text>
      <View style={[styles.stepRow, {backgroundColor: Cores.stepperBg}]}>
        <TouchableOpacity onPress={onMin}><Text style={[styles.stepBtn, {color: Cores.texto}]}>-</Text></TouchableOpacity>
        <Text style={[styles.stepValCard, {color: Cores.texto}]}>{val}</Text>
        <TouchableOpacity onPress={onAdd}><Text style={[styles.stepBtn, {color: Cores.texto}]}>+</Text></TouchableOpacity>
      </View>
    </View>
  );

  if (!appPronto) return null;

  if (tela === 'historico') {
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const filtrado = historico.filter(h => {
      const d = new Date(h.timestamp);
      return d.getMonth() === mesAtual.getMonth() && d.getFullYear() === mesAtual.getFullYear();
    });
    const totalMensal = filtrado.reduce((acc, item) => acc + item.volume, 0);

    return (
      <SafeAreaView style={[styles.container, {backgroundColor: Cores.bg}]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setTela('menu')}><Text style={[styles.backLink, {color: Cores.texto}]}>◀</Text></TouchableOpacity>
          <Text style={[styles.headerTitle, {color: Cores.texto}]}>HISTÓRICO</Text>
          <TouchableOpacity onPress={() => { setHistorico([]); save(null, []); }}><Text style={{color: Cores.danger, paddingRight: 20, fontWeight:'bold'}}>LIMPAR TUDO</Text></TouchableOpacity>
        </View>
        <View style={styles.mesSelector}>
          <TouchableOpacity onPress={() => setMesAtual(new Date(mesAtual.setMonth(mesAtual.getMonth()-1)))}><Text style={{color: Cores.destaque, fontSize: 24}}>◀</Text></TouchableOpacity>
          <Text style={{color: Cores.texto, fontWeight: 'bold', fontSize: 18}}>{meses[mesAtual.getMonth()]} {mesAtual.getFullYear()}</Text>
          <TouchableOpacity onPress={() => setMesAtual(new Date(mesAtual.setMonth(mesAtual.getMonth()+1)))}><Text style={{color: Cores.destaque, fontSize: 24}}>▶</Text></TouchableOpacity>
        </View>
        <View style={[styles.resumoMensalCard, {backgroundColor: Cores.card}]}>
            <Text style={{color: Cores.sub, fontSize: 12, fontWeight: 'bold'}}>VOLUME TOTAL DO MÊS</Text>
            <Text style={{color: Cores.destaque, fontSize: 32, fontWeight: 'bold'}}>{totalMensal} <Text style={{fontSize: 16}}>kg</Text></Text>
        </View>
        <FlatList data={filtrado} contentContainerStyle={{padding: 15}} renderItem={({item}) => (
          <View style={[styles.menuItem, {backgroundColor: Cores.card}]}>
            <View style={{flex: 1}}>
                <Text style={{color: Cores.texto, fontWeight: 'bold'}}>{item.treino}</Text>
                <Text style={{color: Cores.sub, fontSize: 12}}>{item.dataStr}</Text>
            </View>
            <Text style={{color: Cores.destaque, fontWeight: 'bold', marginRight: 10}}>{item.volume} kg</Text>
            <TouchableOpacity onPress={() => removerItemHistorico(item.id)}>
                <Text style={{fontSize: 20}}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )} />
      </SafeAreaView>
    );
  }

  if (tela === 'treino') {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: Cores.bg}]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setTela('menu')}><Text style={[styles.backLink, {color: Cores.texto}]}>◀</Text></TouchableOpacity>
          <Text style={[styles.headerTitle, {color: Cores.texto}]}>{treinoAtivo}</Text>
          <TouchableOpacity onPress={() => {
              const c = {...exercicios}; c[treinoAtivo].push({id: Date.now().toString(), nome: 'Novo', series: 3, rep: 10, carga: 0, feitas: 0});
              setExercicios(c); save(c);
          }}><Text style={[styles.addExBtn, {color: Cores.texto}]}>+ EX</Text></TouchableOpacity>
        </View>
        <FlatList data={exercicios[treinoAtivo]} contentContainerStyle={{padding: 15}} renderItem={({item}) => {
            const concluido = item.feitas >= item.series;
            const isTempo = item.nome.toLowerCase().includes('prancha') || item.nome.toLowerCase().includes('seg');
            const updateEx = (k, v) => {
                const nl = [...exercicios[treinoAtivo]]; const i = nl.findIndex(e => e.id === item.id); nl[i][k] = v;
                const c = {...exercicios}; c[treinoAtivo] = nl; setExercicios(c); save(c);
            };
            return (
              <View style={[styles.card, {backgroundColor: Cores.card, opacity: concluido ? 0.5 : 1, marginBottom: 15}]}>
                <TextInput style={[styles.exName, {color: Cores.texto}]} value={item.nome} onChangeText={(v) => updateEx('nome', v)} />
                <View style={styles.controlsRow}>
                  <Stepper label="SÉRIES" val={item.series} onMin={() => updateEx('series', Math.max(1, item.series-1))} onAdd={() => updateEx('series', item.series+1)} />
                  <Stepper label={isTempo ? "SEG" : "REPS"} val={item.rep} onMin={() => updateEx('rep', Math.max(1, item.rep-1))} onAdd={() => updateEx('rep', item.rep+1)} />
                  <Stepper label="KG" val={item.carga} onMin={() => updateEx('carga', Math.max(0, item.carga-1))} onAdd={() => updateEx('carga', item.carga+1)} />
                </View>
                <TouchableOpacity 
                  style={[styles.btnAction, {backgroundColor: Cores.destaque}]} 
                  onPress={() => {
                    if (concluido) return updateEx('feitas', 0);
                    if (isTempo) {
                        rodarTimer(item.rep, 'execucao');
                        updateEx('feitas', item.feitas + 1);
                    } else {
                        updateEx('feitas', item.feitas + 1);
                        rodarTimer(tempoDescanso, 'descanso');
                    }
                }}>
                    <Text style={styles.btnTxtAction}>
                        {concluido ? 'REINICIAR' : isTempo ? `INICIAR ${item.rep}s` : `SÉRIE ${item.feitas + 1}`}
                    </Text>
                </TouchableOpacity>
              </View>
            );
          }} ListFooterComponent={() => <TouchableOpacity style={[styles.btnFinalizar, {backgroundColor: Cores.destaque}]} onPress={finalizarTreino}><Text style={styles.btnTxtFinalizar}>FINALIZAR TREINO</Text></TouchableOpacity>}
        />
        <Modal visible={timerAtivo} transparent>
          {timerAtivo && <ManterTelaAcesa />}
          <View style={styles.timerOverlay}>
            <View style={[styles.timerBox, {backgroundColor: Cores.card}]}>
              <Text style={{color: Cores.sub, fontWeight: 'bold', marginBottom: 10}}>
                  {tipoTimer === 'execucao' ? 'EXECUTANDO...' : 'DESCANSO'}
              </Text>
              <Text style={[styles.timerNum, {color: Cores.texto}]}>{segundos}s</Text>
              <TouchableOpacity style={[styles.btnSkip, {backgroundColor: Cores.danger}]} onPress={() => { clearInterval(timerRef.current); setTimerAtivo(false); }}>
                  <Text style={{color: '#FFF', fontWeight: 'bold'}}>PULAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: Cores.bg}]}>
      <View style={styles.header}><TextInput style={[styles.headerTitle, {color: Cores.texto}]} value={appTitle} onChangeText={setAppTitle} onEndEditing={() => save(null, null, null, appTitle)} /></View>
      <ScrollView contentContainerStyle={{padding: 15}}>
        <TouchableOpacity style={[styles.btnHist, {borderColor: Cores.destaque, borderWidth: 1}]} onPress={() => setTela('historico')}><Text style={{color: Cores.destaque, fontWeight: 'bold'}}>📜 VER HISTÓRICO</Text></TouchableOpacity>
        <View style={[styles.descansoCard, {backgroundColor: Cores.card}]}>
            <Text style={{color: Cores.sub, fontSize: 10, fontWeight: 'bold'}}>DESCANSO ENTRE SÉRIES (REPS)</Text>
            <div style={{flexDirection: 'row', alignItems: 'center', gap: 20}}>
                <TouchableOpacity onPress={() => { const n = Math.max(10, tempoDescanso-10); setTempoDescanso(n); save(null,null,n); }}><Text style={[styles.stepAction, {color: Cores.destaque}]}>-</Text></TouchableOpacity>
                <Text style={[styles.stepVal, {color: Cores.texto}]}>{tempoDescanso}s</Text>
                <TouchableOpacity onPress={() => { const n = tempoDescanso+10; setTempoDescanso(n); save(null,null,n); }}><Text style={[styles.stepAction, {color: Cores.destaque}]}>+</Text></TouchableOpacity>
            </div>
        </View>
        {Object.keys(exercicios).map((nome) => (
          <View key={nome} style={[styles.menuItem, {backgroundColor: Cores.card}]}>
            <Text style={[styles.menuItemTxt, {color: Cores.texto}]}>{nome}</Text>
            <TouchableOpacity onPress={() => { setTreinoAtivo(nome); setTela('treino'); }} style={[styles.btnGo, {backgroundColor: Cores.destaque}]}><Text style={{color: '#FFF'}}>▶</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { const c = {...exercicios}; delete c[nome]; setExercicios(c); save(c); }}><Text style={{fontSize: 20}}>🗑️</Text></TouchableOpacity>
          </View>
        ))}
        <TextInput style={[styles.inputMenu, {backgroundColor: Cores.card, color: Cores.texto}]} placeholder="Novo treino..." placeholderTextColor={Cores.sub} value={novoTreinoNome} onChangeText={setNovoTreinoNome} />
        <TouchableOpacity style={[styles.btnMenu, {backgroundColor: Cores.destaque}]} onPress={() => { if(!novoTreinoNome) return; const nE = {...exercicios, [novoTreinoNome]: []}; setExercicios(nE); setNovoTreinoNome(''); save(nE); }}><Text style={{color: '#FFF', fontWeight: 'bold'}}>+ ADICIONAR TREINO</Text></TouchableOpacity>
        <TouchableOpacity style={{padding: 20, alignItems: 'center'}} onPress={() => { const nt = tema === 'light' ? 'dark' : 'light'; setTema(nt); save(null,null,null,null,nt); }}><Text style={{color: Cores.sub}}>ALTERNAR TEMA ☀️/🌙</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', flex: 1 },
  backLink: { paddingHorizontal: 20, fontSize: 20 },
  addExBtn: { paddingHorizontal: 20, fontWeight: 'bold' },
  card: { borderRadius: 15, padding: 15 },
  exName: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  stepLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  stepRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 8 },
  stepBtn: { fontSize: 20, paddingHorizontal: 15 },
  stepValCard: { fontSize: 16, fontWeight: 'bold', width: 30, textAlign: 'center' },
  btnAction: { padding: 15, borderRadius: 10, alignItems: 'center' },
  btnTxtAction: { color: '#FFF', fontWeight: 'bold' },
  btnFinalizar: { padding: 20, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  btnTxtFinalizar: { color: '#FFF', fontWeight: 'bold' },
  menuItem: { padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  menuItemTxt: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  btnGo: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  btnHist: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  mesSelector: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, paddingVertical: 10, alignItems: 'center' },
  resumoMensalCard: { marginHorizontal: 15, padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 10 },
  descansoCard: { padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  stepAction: { fontSize: 30, paddingHorizontal: 20 },
  stepVal: { fontSize: 24, fontWeight: 'bold' },
  inputMenu: { padding: 15, borderRadius: 10, marginTop: 10 },
  btnMenu: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  timerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  timerBox: { padding: 40, borderRadius: 20, alignItems: 'center' },
  timerNum: { fontSize: 60, fontWeight: 'bold', marginBottom: 20 },
  btnSkip: { padding: 10, borderRadius: 10, width: 100, alignItems: 'center' }
});
      
