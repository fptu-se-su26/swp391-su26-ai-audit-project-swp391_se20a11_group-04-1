import java.sql.*;
public class TestDB2 {
    public static void main(String[] args) {
        try (Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/dev_track_ai", "postgres", "123");
             Statement stmt = conn.createStatement()) {
            String sql = "SELECT * FROM (SELECT CONCAT('u_', u.id) as id, 'person_add' as type, 'Users' as category, CASE WHEN sr.name = 'MENTOR' THEN CONCAT('New mentor approved: ', u.email) ELSE CONCAT('New user registered: ', u.email) END as message, u.created_at as created_timestamp FROM user_accounts u LEFT JOIN system_roles sr ON u.system_role_id = sr.id WHERE 1=1 UNION ALL SELECT CONCAT('p_', p.id) as id, 'school' as type, 'Projects' as category, CONCAT('Project \"', p.name, '\" created') as message, p.created_at as created_timestamp FROM projects p WHERE 1=1 ) as combined ORDER BY combined.created_timestamp DESC";
            ResultSet rs = stmt.executeQuery(sql);
            int count = 0;
            while (rs.next()) { count++; }
            System.out.println("Query executed successfully. Rows: " + count);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
