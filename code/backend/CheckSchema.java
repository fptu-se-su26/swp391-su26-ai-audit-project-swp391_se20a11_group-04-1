import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckSchema {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/dev_track_ai?options=-c%20timezone=Asia/Ho_Chi_Minh";
        String user = "root";
        String password = "root";
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
             
            System.out.println("--- test_runs NOT NULL columns ---");
            ResultSet rs = stmt.executeQuery("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'test_runs' AND is_nullable = 'NO'");
            while (rs.next()) {
                System.out.println(rs.getString(1) + " (default: " + rs.getString(2) + ")");
            }

            System.out.println("\n--- test_executions NOT NULL columns ---");
            rs = stmt.executeQuery("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'test_executions' AND is_nullable = 'NO'");
            while (rs.next()) {
                System.out.println(rs.getString(1) + " (default: " + rs.getString(2) + ")");
            }
        }
    }
}
