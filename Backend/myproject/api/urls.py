from django.urls import path
from .views import (
    LogoutView, CleanedDataView, DownloadCleanedDataCSV, FullDataDownload,
    UserDetailsView, FullData, MonthDataView, MonthDataDownloadView,
    PowerBITokenView, WhoView, WhyView, HowView, UploadExcelSSBIView,DeleteTableSSBIView,download_csv,
    GetTablesView, GetTableDataView, ai_response ,start_preprocessing, get_status,upload_excel, process_uploaded_data, view_uploaded_data, upload_file, delete_uploaded_file, get_postgres_tables, delete_postgres_tables, trigger_airflow_dags,get_airflow_dag_logs,run_feature_prediction
    ,run_reason_identification, trigger_azure_import,check_dag_status,list_azure_files,run_reason_bucket,run_clv_cleaned,run_clv_prediction,run_segmentation,PastMonthDataView,PastMonthDataDownloadView, fetch_postgres_tables,fetch_oracle_tables,user_details, churned_policies_7days, churned_policies_30days
      # ✅ Function-based views (FBVs)
)

urlpatterns = [
    path("logout/", LogoutView.as_view(), name="logout"),
    path("cleaned-data/", CleanedDataView.as_view(), name="cleaned-data"),
    path("download-cleaned-data/", DownloadCleanedDataCSV.as_view(), name="download-cleaned-data"),
    path("fulldatadownload/", FullDataDownload.as_view(), name="fulldatadownload"),
    # path("user-details/", UserDetailsView.as_view(), name="user-details"),  # ✅ New API added
    path("fulldata/", FullData.as_view(), name="fulldata"),
    path("monthdataview/<int:month>/", MonthDataView.as_view(), name="monthdataview"),
    path("monthdatadownloadview/<int:month>/", MonthDataDownloadView.as_view(), name="monthdatadownloadview"),
    path("powerbitokenview/", PowerBITokenView.as_view(), name="powerbitokenview"),
    path("whoview/", WhoView.as_view(), name="whoview"),
    path("whyview/", WhyView.as_view(), name="whyview"),
    path("howview/", HowView.as_view(), name="howview"),
    path("gettablesview/", GetTablesView.as_view(), name="gettablesview"),
    path("gettabledataview/", GetTableDataView.as_view(), name="gettabledataview"),
    path("ai-response/", ai_response, name="ai-response"),  # ✅ FIXED: Removed `.as_view()`
    path('start-preprocessing/', start_preprocessing, name='start_preprocessing'),
    path('get-status/', get_status, name='get_status'),
    path('view-uploaded-data/',view_uploaded_data, name = "view-uploaded-data"),
    path("upload-excel/", upload_excel, name="upload-excel"),
    path("process-uploaded-data/", process_uploaded_data, name="process-uploaded-data"),
    path("upload-file/",upload_file, name = "upload_file"),
    path("delete-uploaded-file/", delete_uploaded_file, name = "delete-uploaded-file"),
    path("get-postgres-tables/", get_postgres_tables, name = "get-postgres-tables"),
    path("delete-postgres-tables/",delete_postgres_tables, name= "delete-postgres-tables"),
    path("trigger-airflow-dags/",trigger_airflow_dags, name = "trigger-airflow-dags"),
    path("get-airflow-dag-logs/",get_airflow_dag_logs, name = "get-airflow-dag-logs"),
    path('run-feature-prediction/', run_feature_prediction, name = "run-feature-prediction"),
    path('run-reason-identification/',run_reason_identification, name = "run_reason_identification"),
    path('run-reason-bucket/', run_reason_bucket, name = 'run_reason_bucket'),
    path('run-clv-cleaned/',run_clv_cleaned,name = 'run_clv_cleaned'),
    path('run-clv-prediction/',run_clv_prediction,name = 'run_CLV_prediction'),
    path('run-segmentation/',run_segmentation,name = 'run_segmentation'),
    path("pastmonthdataview/<int:month>/", PastMonthDataView.as_view(), name="pastmonthdataview"),
    path("pastmonthdatadownloadview/<int:month>/", PastMonthDataDownloadView.as_view(), name="pastmonthdatadownloadview"),
    path("uploadexcelssbiview/", UploadExcelSSBIView.as_view(), name="uploadexcelssbiview"),
    path("deletetablessbiview/<str:table_name>/", DeleteTableSSBIView.as_view(), name="deletetablessbiview"),
    path('fetchpostgrestables/',fetch_postgres_tables,name = 'fetchpostgrestables'),
    path('fetchoracletables/',fetch_oracle_tables,name = 'fetchoracletables'),
    path('user-details/',user_details,name = 'user_details'),
    path('churnedpolicies7days', churned_policies_7days, name='churned-policies-7days'),
    path('churnedpolicies30days', churned_policies_30days, name='churned-policies-30days'),
    path('azure-files', list_azure_files,name='azurefiles'),
    path('triggerazureimport', trigger_azure_import,name='trigger_azure_import'),
    path('checkdagstatus', check_dag_status,name='check_dag_status'),
    path('download_csv', download_csv,name='download_csv'),


] 