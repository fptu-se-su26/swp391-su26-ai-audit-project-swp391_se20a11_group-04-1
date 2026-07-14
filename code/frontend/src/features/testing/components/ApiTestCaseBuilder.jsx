import React, { useState, useEffect } from 'react'
import KeyValueEditor from './KeyValueEditor'
import { testCaseService } from '../services/testCaseService'

export default function ApiTestCaseBuilder({ testCase, onSave, isSaving }) {
  const cfg = testCase.configuration || {}
  const [method, setMethod] = useState(cfg.apiMethod || 'GET')
  const [url, setUrl] = useState(cfg.apiUrl || '')
  const [reqTab, setReqTab] = useState('Params') // Params, Headers, Body, Assertions
  const [agentToken, setAgentToken] = useState(null)
  
  const isLocalUrl = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0')

  useEffect(() => {
    if (isLocalUrl && testCase?.projectId && !agentToken) {
      testCaseService.getAgentToken(testCase.projectId)
        .then(token => setAgentToken(token))
        .catch(err => console.error("Failed to fetch agent token:", err))
    }
  }, [isLocalUrl, testCase, agentToken])
  
  // Transform initial object/string to KeyValue array
  const objToKv = (obj) => {
    if (!obj) return []
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj) } catch { return [] }
    }
    return Object.entries(obj).map(([key, value]) => ({ key, value }))
  }

  const [headers, setHeaders] = useState(() => {
    const kv = objToKv(cfg.apiHeaders)
    return kv.length ? kv : [{ key: '', value: '' }]
  })
  
  const [queryParams, setQueryParams] = useState(() => {
    const kv = objToKv(cfg.apiQueryParams)
    return kv.length ? kv : [{ key: '', value: '' }]
  })
  
  // Body string
  const [body, setBody] = useState(() => {
    if (!cfg.apiBody) return ''
    if (typeof cfg.apiBody === 'string') return cfg.apiBody
    return JSON.stringify(cfg.apiBody, null, 2)
  })

  // Assertions array
  const [assertions, setAssertions] = useState(() => {
    let arr = cfg.apiAssertions
    if (typeof arr === 'string') {
      try { arr = JSON.parse(arr) } catch { arr = [] }
    }
    if (Array.isArray(arr) && arr.length > 0) return arr
    return []
  })

  useEffect(() => {
    const c = testCase.configuration || {}
    setMethod(c.apiMethod || 'GET')
    setUrl(c.apiUrl || '')
    
    const hkv = objToKv(c.apiHeaders)
    setHeaders(hkv.length ? hkv : [{ key: '', value: '' }])
    
    const pkv = objToKv(c.apiQueryParams)
    setQueryParams(pkv.length ? pkv : [{ key: '', value: '' }])
    
    const bodyStr = !c.apiBody ? '' : 
      typeof c.apiBody === 'string' ? c.apiBody : 
      JSON.stringify(c.apiBody, null, 2)
    setBody(bodyStr)
    
    let arr = c.apiAssertions
    if (typeof arr === 'string') {
      try { arr = JSON.parse(arr) } catch { arr = [] }
    }
    setAssertions(Array.isArray(arr) && arr.length > 0 ? arr : [])
  }, [testCase])

  const handleFormatBody = () => {
    if (!body.trim()) return
    try {
      const parsed = JSON.parse(body)
      setBody(JSON.stringify(parsed, null, 2))
    } catch {
      // Ignore if invalid JSON
    }
  }

  const handleSave = () => {
    // Transform back to Object
    const kvToObj = (kvList) => {
      const obj = {}
      kvList.forEach(item => {
        if (item.key.trim()) obj[item.key.trim()] = item.value
      })
      return obj
    }

    let parsedBody = null
    if (body.trim()) {
      try { parsedBody = JSON.parse(body) } catch { parsedBody = body }
    }

    const payload = {
      title: testCase.title,
      requirementId: testCase.requirement?.id,
      type: testCase.type || 'API',
      precondition: testCase.precondition,
      expectedResult: testCase.expectedResult,
      configuration: {
        type: 'API',
        apiMethod: method,
        apiUrl: url,
        apiHeaders: kvToObj(headers),
        apiQueryParams: kvToObj(queryParams),
        apiBody: parsedBody,
        apiAssertions: assertions.filter(a => {
          if (!a.type || !a.operator) return false
          if (a.operator !== 'EXISTS' && !a.expectedValue?.trim()) return false
          return true
        })
      }
    }

    onSave(payload)
  }

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden font-mono text-sm shadow-sm">
      {/* Request Header */}
      <div className="flex items-center gap-3 p-3 border-b border-outline-variant bg-surface-container-low">
        <select 
          className="px-4 py-2 bg-surface-container-highest border border-outline-variant rounded-md font-semibold text-[#1E707D] focus:outline-none focus:ring-2 focus:ring-[#1E707D]/50 transition-shadow appearance-none cursor-pointer"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input 
          type="text" 
          placeholder="https://api.example.com/v1/resource"
          className="flex-1 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E707D]/50 transition-shadow"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-[#1E707D] text-white rounded-md font-bold hover:bg-primary-fixed-variant transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
          {isSaving ? 'Saving...' : 'Save Config'}
        </button>
      </div>

      {isLocalUrl && (
        <div className="mx-4 mt-5 mb-2 p-1.5 bg-[#1E707D]/5 border border-[#1E707D]/10 rounded-[1.5rem] shadow-sm transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
          <div className="bg-surface-container-lowest rounded-[calc(1.5rem-0.375rem)] p-5 border border-outline-variant/30 relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#1E707D]/10 blur-[64px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#1E707D]/10 flex items-center justify-center text-[#1E707D]">
                    <span className="material-symbols-outlined text-[14px]">terminal</span>
                  </div>
                  <h3 className="text-sm font-semibold text-on-surface tracking-tight">
                    DevTrack Local Bridge
                  </h3>
                </div>
                <p className="text-[13px] leading-relaxed text-secondary max-w-lg">
                  To securely route this test to your localhost, execute the DevTrack Agent in your terminal. It acts as a secure bridge to your machine.
                </p>
              </div>

              <div className="w-full lg:w-auto">
                {agentToken ? (
                  <div className="group relative flex items-center p-1 bg-surface-container-low border border-outline-variant/50 rounded-[1.25rem] transition-all duration-500 hover:border-outline-variant shadow-inner">
                    <div className="px-4 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide max-w-[320px]">
                      <code className="text-[12px] font-mono text-secondary group-hover:text-on-surface transition-colors select-all">
                        npx devtrack-agent@latest --token={agentToken}
                      </code>
                    </div>
                    <button 
                      onClick={() => {
                        const text = `npx devtrack-agent@latest --token=${agentToken}`;
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(text);
                        } else {
                          const el = document.createElement('textarea');
                          el.value = text;
                          document.body.appendChild(el);
                          el.select();
                          document.execCommand('copy');
                          document.body.removeChild(el);
                        }
                      }}
                      className="ml-2 flex items-center justify-center w-8 h-8 bg-surface-container-highest rounded-xl border border-outline-variant/50 text-secondary hover:text-[#1E707D] hover:bg-surface-container hover:shadow-sm active:scale-[0.92] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex-shrink-0 cursor-pointer"
                      title="Copy command"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    </button>
                  </div>
                ) : (
                  <div className="h-[46px] w-full lg:w-[340px] flex items-center px-4 bg-surface-container-low rounded-[1.25rem] animate-pulse">
                    <div className="h-2 w-24 bg-surface-container-highest rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Pane */}
      <div className="flex-1 flex flex-col min-h-[400px]">
        {/* Tabs */}
        <div className="flex bg-surface-container-low border-b border-outline-variant px-4">
          {['Params', 'Headers', 'Body', 'Assertions'].map(tab => (
            <button 
              key={tab}
              onClick={() => setReqTab(tab)}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                reqTab === tab ? 'border-[#1E707D] text-[#1E707D]' : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-container-lowest flex flex-col">
          {reqTab === 'Params' && (
            <div className="max-w-3xl">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Query Parameters</h3>
              <KeyValueEditor items={queryParams} onChange={setQueryParams} />
            </div>
          )}
          
          {reqTab === 'Headers' && (
            <div className="max-w-3xl">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Request Headers</h3>
              <KeyValueEditor items={headers} onChange={setHeaders} />
            </div>
          )}
          
          {reqTab === 'Body' && (
            <div className="flex flex-col h-full flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">JSON Body</h3>
                <button onClick={handleFormatBody} className="text-xs text-[#1E707D] hover:underline font-medium">Format JSON</button>
              </div>
              <textarea 
                className="flex-1 w-full p-4 bg-surface-container text-sm font-mono border border-outline-variant rounded focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] outline-none resize-none transition-all"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onBlur={handleFormatBody}
                placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
                spellCheck="false"
              />
            </div>
          )}
          
          {reqTab === 'Assertions' && (
            <div className="max-w-4xl">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Test Assertions</h3>
              <AssertionBuilder assertions={assertions} onChange={setAssertions} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AssertionBuilder({ assertions, onChange }) {
  const TYPES = ['STATUS_CODE', 'RESPONSE_TIME', 'HEADER', 'JSON_PATH']
  const OPERATORS = ['EQUALS', 'CONTAINS', 'EXISTS', 'GREATER_THAN', 'LESS_THAN']

  const handleAdd = () => {
    onChange([...assertions, { type: 'STATUS_CODE', operator: 'EQUALS', property: '', expectedValue: '' }])
  }

  const handleUpdate = (index, field, value) => {
    const newAss = [...assertions]
    newAss[index] = { ...newAss[index], [field]: value }
    // Clean up irrelevant fields
    if (field === 'type') {
      if (!['HEADER', 'JSON_PATH'].includes(value)) newAss[index].property = ''
    }
    if (field === 'operator') {
      if (value === 'EXISTS') newAss[index].expectedValue = ''
    }
    onChange(newAss)
  }

  const handleRemove = (index) => {
    const newAss = [...assertions]
    newAss.splice(index, 1)
    onChange(newAss)
  }

  return (
    <div className="flex flex-col gap-3">
      {assertions.map((ass, idx) => {
        const needsProperty = ['HEADER', 'JSON_PATH'].includes(ass.type)
        const needsValue = ass.operator !== 'EXISTS'

        return (
          <div key={idx} className="flex gap-2 items-center group bg-surface-container p-2 rounded border border-outline-variant/50">
            <select
              value={ass.type || 'STATUS_CODE'}
              onChange={e => handleUpdate(idx, 'type', e.target.value)}
              className="w-40 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded font-semibold text-xs outline-none"
            >
              {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>

            {needsProperty && (
              <input
                type="text"
                placeholder={ass.type === 'HEADER' ? 'Header Name' : '$.path'}
                value={ass.property || ''}
                onChange={e => handleUpdate(idx, 'property', e.target.value)}
                className="w-48 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded text-xs outline-none focus:border-[#1E707D]"
              />
            )}

            <select
              value={ass.operator || 'EQUALS'}
              onChange={e => handleUpdate(idx, 'operator', e.target.value)}
              className="w-36 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded font-semibold text-xs outline-none"
            >
              {OPERATORS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
            </select>

            {needsValue && (
              <input
                type="text"
                placeholder="Expected Value"
                value={ass.expectedValue || ''}
                onChange={e => handleUpdate(idx, 'expectedValue', e.target.value)}
                className="flex-1 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded text-xs outline-none focus:border-[#1E707D]"
              />
            )}

            {!needsValue && <div className="flex-1" />}

            <button
              onClick={() => handleRemove(idx)}
              className="p-1.5 text-error opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-error-container hover:text-on-error-container"
              title="Remove Assertion"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        )
      })}
      
      {assertions.length === 0 && (
        <div className="text-secondary text-xs italic py-4">No assertions added yet.</div>
      )}

      <button
        onClick={handleAdd}
        className="self-start px-3 py-2 mt-2 text-xs font-bold text-white bg-[#1E707D] hover:bg-primary-fixed-variant rounded-md shadow-sm transition-colors flex items-center gap-1 uppercase tracking-wide"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
        Add Assertion
      </button>
    </div>
  )
}
