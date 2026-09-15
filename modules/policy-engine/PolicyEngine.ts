
import { Policy, PolicyRule } from '../../types';

export interface PolicyEvaluationResult {
  allowed: boolean;
  actions: { type: string; message?: string }[];
  triggeredPolicies: Policy[];
}

export const policyEngine = {
  /**
   * Evaluate a value against a single rule
   */
  evaluateRule: (rule: PolicyRule, context: any): boolean => {
    // Navigate dot notation (e.g. 'payroll.total')
    const keys = rule.field.split('.');
    let value = context;
    for (const key of keys) {
      if (value === undefined || value === null) return false;
      value = value[key];
    }

    switch (rule.operator) {
      case 'gt': return value > rule.value;
      case 'lt': return value < rule.value;
      case 'eq': return value == rule.value; // Loose equality for flexibility
      case 'neq': return value != rule.value;
      case 'contains': 
        return Array.isArray(value) ? value.includes(rule.value) : String(value).includes(String(rule.value));
      default: return false;
    }
  },

  /**
   * Evaluate all policies against a context object
   */
  evaluate: (policies: Policy[], context: any, scope: { country?: string, module?: string }): PolicyEvaluationResult => {
    const result: PolicyEvaluationResult = {
      allowed: true,
      actions: [],
      triggeredPolicies: []
    };

    // Filter relevant policies
    const relevantPolicies = policies
      .filter(p => p.enabled)
      .filter(p => !p.scope.country_code || p.scope.country_code === scope.country)
      .filter(p => !p.scope.module || p.scope.module === scope.module)
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    for (const policy of relevantPolicies) {
      // Check if ALL rules in the policy match (AND logic)
      const allRulesMatch = policy.rules.every(rule => policyEngine.evaluateRule(rule, context));

      if (allRulesMatch) {
        result.triggeredPolicies.push(policy);
        
        // Collect actions
        for (const action of policy.actions) {
          result.actions.push(action);
          if (action.type === 'block') {
            result.allowed = false;
          }
          if (action.type === 'require_approval') {
            // Can be treated as allowed-but-pending or blocked-until-approved. 
            // For now, we flag it in actions. The consumer decides flow.
          }
        }
      }
    }

    return result;
  }
};
