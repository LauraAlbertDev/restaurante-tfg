class AuditMixin:
    def get_audit_select(self, alias="r"):
        return f"""
            {alias}.created_by,
            {alias}.updated_at,
            {alias}.updated_by,
            u1.name as creator_name,
            u2.name as editor_name
        """

    def get_audit_joins(self, alias="r"):
        return f"""
            LEFT JOIN users u1 ON {alias}.created_by = u1.id
            LEFT JOIN users u2 ON {alias}.updated_by = u2.id
        """