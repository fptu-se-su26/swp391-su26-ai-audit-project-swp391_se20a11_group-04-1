-- Rename SLA risk level values in task_sla_states
UPDATE task_sla_states SET current_risk_level   = 'HEALTHY'  WHERE current_risk_level   = 'NORMAL';
UPDATE task_sla_states SET current_risk_level   = 'ON_TRACK' WHERE current_risk_level   = 'LOW';
UPDATE task_sla_states SET current_risk_level   = 'AT_RISK'  WHERE current_risk_level   = 'MEDIUM';
UPDATE task_sla_states SET current_risk_level   = 'WARNING'  WHERE current_risk_level   = 'HIGH';
UPDATE task_sla_states SET current_risk_level   = 'BREACH'   WHERE current_risk_level   = 'CRITICAL';

UPDATE task_sla_states SET predicted_risk_level = 'HEALTHY'  WHERE predicted_risk_level = 'NORMAL';
UPDATE task_sla_states SET predicted_risk_level = 'ON_TRACK' WHERE predicted_risk_level = 'LOW';
UPDATE task_sla_states SET predicted_risk_level = 'AT_RISK'  WHERE predicted_risk_level = 'MEDIUM';
UPDATE task_sla_states SET predicted_risk_level = 'WARNING'  WHERE predicted_risk_level = 'HIGH';
UPDATE task_sla_states SET predicted_risk_level = 'BREACH'   WHERE predicted_risk_level = 'CRITICAL';

-- Rename in sla_decision_logs
UPDATE sla_decision_logs SET previous_risk_level = 'HEALTHY'  WHERE previous_risk_level = 'NORMAL';
UPDATE sla_decision_logs SET previous_risk_level = 'ON_TRACK' WHERE previous_risk_level = 'LOW';
UPDATE sla_decision_logs SET previous_risk_level = 'AT_RISK'  WHERE previous_risk_level = 'MEDIUM';
UPDATE sla_decision_logs SET previous_risk_level = 'WARNING'  WHERE previous_risk_level = 'HIGH';
UPDATE sla_decision_logs SET previous_risk_level = 'BREACH'   WHERE previous_risk_level = 'CRITICAL';

UPDATE sla_decision_logs SET new_risk_level = 'HEALTHY'  WHERE new_risk_level = 'NORMAL';
UPDATE sla_decision_logs SET new_risk_level = 'ON_TRACK' WHERE new_risk_level = 'LOW';
UPDATE sla_decision_logs SET new_risk_level = 'AT_RISK'  WHERE new_risk_level = 'MEDIUM';
UPDATE sla_decision_logs SET new_risk_level = 'WARNING'  WHERE new_risk_level = 'HIGH';
UPDATE sla_decision_logs SET new_risk_level = 'BREACH'   WHERE new_risk_level = 'CRITICAL';

-- Rename in recovery_plans
UPDATE recovery_plans SET risk_level = 'HEALTHY'  WHERE risk_level = 'NORMAL';
UPDATE recovery_plans SET risk_level = 'ON_TRACK' WHERE risk_level = 'LOW';
UPDATE recovery_plans SET risk_level = 'AT_RISK'  WHERE risk_level = 'MEDIUM';
UPDATE recovery_plans SET risk_level = 'WARNING'  WHERE risk_level = 'HIGH';
UPDATE recovery_plans SET risk_level = 'BREACH'   WHERE risk_level = 'CRITICAL';
