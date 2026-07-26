# Ejemplo de Integración Frontend - Sistema KYC por Niveles

## Componente React - Flujo Completo

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface KYCLevel {
  completed: boolean;
  completedAt: Date | null;
  data: any;
}

interface KYCProgress {
  hasVerification: boolean;
  verificationId?: number;
  currentLevel: number;
  status: string;
  levels: {
    level1: KYCLevel;
    level2: KYCLevel;
    level3: KYCLevel;
  };
}

const KYCLevelFlow: React.FC = () => {
  const [progress, setProgress] = useState<KYCProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Cargar progreso al montar el componente
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const response = await axios.get('/api/kyc/level/progress', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setProgress(response.data.data);
      
      // Determinar en qué paso está el usuario
      if (response.data.data.hasVerification) {
        const { levels } = response.data.data;
        if (!levels.level1.completed) {
          setCurrentStep(1);
        } else if (!levels.level2.completed) {
          setCurrentStep(2);
        } else if (!levels.level3.completed) {
          setCurrentStep(3);
        } else {
          setCurrentStep(4); // Completado, esperando revisión
        }
      }
    } catch (error) {
      console.error('Error loading KYC progress:', error);
    }
  };

  const saveProgress = async (level: number, data: any) => {
    try {
      await axios.post('/api/kyc/level/save', 
        { level, data },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log('Progress saved');
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const completeLevel = async (level: number, data: any) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/kyc/level/complete',
        { level, data },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      alert(response.data.data.message);
      
      // Recargar progreso
      await loadProgress();
      
      // Avanzar al siguiente paso
      if (level < 3) {
        setCurrentStep(level + 1);
      } else {
        setCurrentStep(4); // Completado
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Error al completar nivel');
    } finally {
      setLoading(false);
    }
  };

  // Componente Nivel 1
  const Level1Form = () => {
    const [formData, setFormData] = useState({
      fullName: progress?.levels.level1.data?.fullName || '',
      documentType: progress?.levels.level1.data?.documentType || 'cedula',
      documentNumber: progress?.levels.level1.data?.documentNumber || '',
      dateOfBirth: progress?.levels.level1.data?.dateOfBirth || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const newData = { ...formData, [e.target.name]: e.target.value };
      setFormData(newData);
      
      // Auto-guardar progreso cada vez que cambia un campo
      saveProgress(1, newData);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      completeLevel(1, formData);
    };

    return (
      <form onSubmit={handleSubmit} className="kyc-form">
        <h2>Nivel 1: Información Básica</h2>
        
        <div className="form-group">
          <label>Nombre Completo</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Tipo de Documento</label>
          <select
            name="documentType"
            value={formData.documentType}
            onChange={handleChange}
            required
          >
            <option value="cedula">Cédula</option>
            <option value="pasaporte">Pasaporte</option>
            <option value="rif">RIF</option>
          </select>
        </div>

        <div className="form-group">
          <label>Número de Documento</label>
          <input
            type="text"
            name="documentNumber"
            value={formData.documentNumber}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Fecha de Nacimiento</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Procesando...' : 'Completar Nivel 1'}
        </button>
      </form>
    );
  };

  // Componente Nivel 2
  const Level2Form = () => {
    const [formData, setFormData] = useState({
      nationality: progress?.levels.level2.data?.nationality || '',
      address: progress?.levels.level2.data?.address || '',
      city: progress?.levels.level2.data?.city || '',
      state: progress?.levels.level2.data?.state || '',
      postalCode: progress?.levels.level2.data?.postalCode || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newData = { ...formData, [e.target.name]: e.target.value };
      setFormData(newData);
      saveProgress(2, newData);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      completeLevel(2, formData);
    };

    return (
      <form onSubmit={handleSubmit} className="kyc-form">
        <h2>Nivel 2: Información Adicional</h2>
        
        <div className="form-group">
          <label>Nacionalidad</label>
          <input
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Dirección</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Ciudad</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Estado</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Código Postal</label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Procesando...' : 'Completar Nivel 2'}
        </button>
      </form>
    );
  };

  // Componente Nivel 3
  const Level3Form = () => {
    const [documents, setDocuments] = useState({
      idFront: null as File | null,
      idBack: null as File | null,
      selfie: null as File | null,
      selfieWithDoc: null as File | null,
      livenessVideo: null as File | null,
      proofOfAddress: null as File | null
    });

    const handleFileChange = (documentType: string, file: File | null) => {
      setDocuments(prev => ({ ...prev, [documentType]: file }));
    };

    const uploadDocument = async (documentType: string, file: File) => {
      const formData = new FormData();
      formData.append('verificationId', progress?.verificationId?.toString() || '');
      formData.append('documentType', documentType);
      formData.append('file', file);

      await axios.post('/api/kyc/upload', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        // Subir todos los documentos
        if (documents.idFront) await uploadDocument('id_front', documents.idFront);
        if (documents.idBack) await uploadDocument('id_back', documents.idBack);
        if (documents.selfie) await uploadDocument('selfie', documents.selfie);
        if (documents.selfieWithDoc) await uploadDocument('selfie_with_doc', documents.selfieWithDoc);
        if (documents.livenessVideo) await uploadDocument('liveness_video', documents.livenessVideo);
        if (documents.proofOfAddress) await uploadDocument('proof_of_address', documents.proofOfAddress);

        // Completar nivel 3
        await completeLevel(3, {
          documentsUploaded: true,
          uploadedAt: new Date().toISOString()
        });
      } catch (error: any) {
        alert(error.response?.data?.error?.message || 'Error al subir documentos');
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="kyc-form">
        <h2>Nivel 3: Documentos y Verificación</h2>
        
        <div className="form-group">
          <label>Documento de Identidad (Frente)</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleFileChange('idFront', e.target.files?.[0] || null)}
            required
          />
        </div>

        <div className="form-group">
          <label>Documento de Identidad (Reverso)</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleFileChange('idBack', e.target.files?.[0] || null)}
            required
          />
        </div>

        <div className="form-group">
          <label>Selfie</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleFileChange('selfie', e.target.files?.[0] || null)}
            required
          />
        </div>

        <div className="form-group">
          <label>Selfie con Documento</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleFileChange('selfieWithDoc', e.target.files?.[0] || null)}
            required
          />
        </div>

        <div className="form-group">
          <label>Video de Liveness</label>
          <input
            type="file"
            accept="video/webm,video/mp4"
            onChange={(e) => handleFileChange('livenessVideo', e.target.files?.[0] || null)}
            required
          />
        </div>

        <div className="form-group">
          <label>Comprobante de Domicilio</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleFileChange('proofOfAddress', e.target.files?.[0] || null)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Subiendo documentos...' : 'Completar Nivel 3 y Enviar a Revisión'}
        </button>
      </form>
    );
  };

  // Componente de estado completado
  const CompletedStatus = () => (
    <div className="kyc-completed">
      <h2>✅ KYC Completado</h2>
      <p>Tu solicitud ha sido enviada al panel de aprobaciones del operador.</p>
      <p>Estado actual: <strong>{progress?.status}</strong></p>
      <p>Recibirás una notificación cuando tu verificación sea revisada.</p>
    </div>
  );

  // Indicador de progreso
  const ProgressIndicator = () => (
    <div className="progress-indicator">
      <div className={`step ${currentStep >= 1 ? 'active' : ''} ${progress?.levels.level1.completed ? 'completed' : ''}`}>
        <span>1</span>
        <p>Información Básica</p>
      </div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''} ${progress?.levels.level2.completed ? 'completed' : ''}`}>
        <span>2</span>
        <p>Información Adicional</p>
      </div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''} ${progress?.levels.level3.completed ? 'completed' : ''}`}>
        <span>3</span>
        <p>Documentos</p>
      </div>
      <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
        <span>✓</span>
        <p>Revisión</p>
      </div>
    </div>
  );

  return (
    <div className="kyc-level-flow">
      <h1>Verificación de Identidad (KYC)</h1>
      
      <ProgressIndicator />

      {currentStep === 1 && <Level1Form />}
      {currentStep === 2 && <Level2Form />}
      {currentStep === 3 && <Level3Form />}
      {currentStep === 4 && <CompletedStatus />}
    </div>
  );
};

export default KYCLevelFlow;
```

## Estilos CSS Sugeridos

```css
.kyc-level-flow {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.progress-indicator {
  display: flex;
  justify-content: space-between;
  margin: 40px 0;
  position: relative;
}

.progress-indicator::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 2px;
  background: #e0e0e0;
  z-index: -1;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.step span {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 10px;
}

.step.active span {
  background: #2196F3;
  color: white;
}

.step.completed span {
  background: #4CAF50;
  color: white;
}

.step p {
  font-size: 12px;
  text-align: center;
  color: #666;
}

.kyc-form {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

button[type="submit"] {
  width: 100%;
  padding: 12px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

button[type="submit"]:hover {
  background: #1976D2;
}

button[type="submit"]:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.kyc-completed {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.kyc-completed h2 {
  color: #4CAF50;
  margin-bottom: 20px;
}
```

## Notas de Implementación

1. **Auto-guardado**: El formulario guarda automáticamente el progreso cada vez que el usuario cambia un campo
2. **Persistencia**: El progreso se mantiene incluso si el usuario cierra la sesión
3. **Validación**: El sistema valida que los niveles se completen en orden
4. **Feedback**: Se muestra un mensaje claro cuando se completa cada nivel
5. **Estado visual**: El indicador de progreso muestra claramente en qué paso está el usuario
