from django.urls import path, include
from django.contrib import admin
from django.http import HttpResponseRedirect

from api.views import backend_status,RegisterUserView,ChurnSendEmail,ChurnProbability,ChurnLatestSelected,ChurnDraftEmail,ChurnSaveSelected,ChurnSimulateManual,ChurnAutoSuggest,DrillthroughView,list_corpus_entries,search_corpus,save_to_corpus_endpoint,dashboard_api,ChurnSegments,ChurnPolicies,ChurnPolicies,ChurnParamRanges,ChurnPolicyDetail,download_reason_data ,DownloadFullDataForSegment,connect_database,ask_qwen,check_intent,connect_database,ask_question,remove_profile_image,UpdateUserView,delete_user,get_roles,MyTokenObtainPairView,ReportAPIView,ReportSearchAPIView,ReportDetailAPIView,LoginView, BusinessMetricsView,FullData,PowerBITokenView, WhyView,WhoView,HowView, GetTableDataView,GetTablesView, start_preprocessing,  upload_excel, process_uploaded_data, view_uploaded_data, upload_file, delete_uploaded_file,get_postgres_tables, delete_postgres_tables, trigger_airflow_dags, get_airflow_dag_logs, run_feature_prediction
from api.views import run_reason_identification,ask_question_stream,churn_dashboard,get_table_data,get_tables,get_columns,upload_pdfbot,ask_questionbot,check_dag_status,trigger_azure_import,list_azure_files,run_reason_bucket,run_clv_cleaned,run_clv_prediction,run_segmentation,PastMonthDataView, PastMonthDataDownloadView, UploadExcelSSBIView, DeleteTableSSBIView, test_env_vars, UserDetailsView, fetch_postgres_tables, fetch_oracle_tables,user_details, churned_policies_7days,churned_policies_30days, reason_detail_api,reason_summary_api

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from api import views
from django.conf.urls.static import static


# ✅ Redirect to React Frontend
def home_redirect(request):
    # return HttpResponseRedirect("http://localhost:5173/")
      return HttpResponseRedirect("http://localhost:5173/")

urlpatterns = [
    path("admin/", admin.site.urls),  # ✅ Django Admin Panel
    path("", home_redirect, name="home"),  # ✅ Redirect Home to React
    path("api/", include("api.urls")),  # ✅ Includes all API Endpoints
    path("bulk-email/", include("bulk_email.urls")),
    path("health_monitor/", include("health_monitor.urls")),
    path("configurations/", include("configurations.urls")),
    path("dataconnectors/", include("dataconnectors.urls")),
    path("analytics/", include("analytics.urls")),
    path('api/roles/', get_roles, name='get_roles'),
    path('api/users/delete/<int:user_id>/', delete_user, name='delete-user'),
    path('api/users/update/<int:user_id>/', UpdateUserView.as_view(), name='update-user'),
    path('api/users/remove_image/<int:user_id>/', remove_profile_image),
    path('api/dashboard/', dashboard_api, name='dashboard_api'),


    path('api/users/create/', views.CreateUserView.as_view()),
    path('api/users/me/', views.CurrentUserView.as_view()),
    path('api/users/', views.ListUsersView.as_view()),
    path('api/pages/', views.ListPagesView.as_view()),
    path('api/assign_page/', views.AssignPageView.as_view()),
    path('api/remove_page_access/<int:id>/', views.RemovePageAccessView.as_view()),


    # ✅ Authentication Routes
    path("api/register/", RegisterUserView.as_view(), name="register"),
    path("api/login/", MyTokenObtainPairView.as_view(), name="login"),
    path("api/token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # ✅ DRF Auth URLs
    path("api-auth/", include("rest_framework.urls")),
    path('user-details/', UserDetailsView.as_view(), name='user-details'),


    # ✅ Power BI Token Retrieval
    path("api/get-powerbi-token/", PowerBITokenView.as_view(), name="get_powerbi_token"),
    path("api/fulldata/", FullData.as_view(), name="fulldata"),
    path("api/who-view/", WhoView.as_view(), name="who-view"),
    path("api/why-view/", WhyView.as_view(), name="why-view"),
    path("api/how-view/", HowView.as_view(), name="how-view"),
    path("api/gettablesview/", GetTablesView.as_view(), name="gettablesview"),
    path("api/gettabledataview/", GetTableDataView.as_view(), name="gettabledataview"),
    path("api/startprocessing/", start_preprocessing, name="startprocessing"),
    path("api/upload-excel/", upload_excel, name="upload_excel"),
    path("api/process-uploaded-data/", process_uploaded_data, name="process_uploaded_data"),
    path("api/view-uploaded-data/", view_uploaded_data, name="view-uploaded-data"),
    path("api/upload-file/",upload_file, name = "upload-file"),
    path("api/delete-uploaded-file/", delete_uploaded_file, name = "delete-uploaded-file"),
    path("api/get-postgres-tables/", get_postgres_tables, name = "get-postgres-tables"),
    path("api/delete-postgres-tables/", delete_postgres_tables, name = "delete-postgres-tables"),
    path("api/trigger-airflow-dags/",trigger_airflow_dags, name = "trigger-airflow-dags"),
    path("api/get-airflow-dag-logs/",get_airflow_dag_logs, name = "get-airflow-dag-logs"),
    path('api/run-feature-prediction/', run_feature_prediction, name = "run-feature-prediction"),
    path('api/run-reason-identification/',run_reason_identification, name = "run_reason_identification"),
    path('api/run-reason-bucket/', run_reason_bucket, name = 'run_reason_bucket'),
    path('api/run-clv-cleaned/',run_clv_cleaned,name = 'run_clv_cleaned'),
    path('api/run-clv-prediction/',run_clv_prediction,name = 'run_CLV_prediction'),
    path('api/run-segmentation/',run_segmentation,name = 'run_segmentation'),
    path("api/pastmonthdataview/<int:month>/", PastMonthDataView.as_view(), name="pastmonthdataview"),
    path("api/pastmonthdatadownloadview/", PastMonthDataDownloadView.as_view(), name="pastmonthdatadownloadview"),
    path("api/uploadexcelssbiview/", UploadExcelSSBIView.as_view(), name="uploadexcelssbiview"),
    path("api/businessmetrics/", BusinessMetricsView.as_view(), name="businessmetrics"),
    path("api/deletetablessbiview/<str:table_name>/", DeleteTableSSBIView.as_view(), name="deletetablessbiview"),
    path('api/test-env-vars/',test_env_vars,name = 'test-env-vars'),
    path('api/fetchpostgrestables/',fetch_postgres_tables,name = 'fetchpostgrestables'),
    path('api/fetchoracletables/',fetch_oracle_tables,name = 'fetchoracletables'),
    path('api/user-details/',user_details,name = 'user_details'),
    path('api/churnedpolicies7days/', churned_policies_7days, name='churned-policies-7days'),
    path('api/churnedpolicies30days/', churned_policies_30days, name='churned-policies-30days'),
    path('api/reason_details/', reason_summary_api, name='reason_detail_api'),
    path('api/reason_details/<str:reason>/', reason_detail_api, name='reason_detail_api'),
    path('api/azure-files', list_azure_files,name='azurefiles'),
    path('api/trigger-azure-import', trigger_azure_import,name='trigger_azure_import'),
    path('api/check-dag-status', check_dag_status,name='check_dag_status'),
    path('api/uploadpdf', upload_pdfbot,name='upload_pdfbot'),
    path('api/askbot', ask_questionbot,name='ask_questionbot'),
    path('api/gettabledata', get_table_data,name='get_table_data'),
    path('api/gettables', get_tables,name='get_tables'),
    path('api/getcolumns', get_columns,name='get_columns'),
    path('api/churndashboard', churn_dashboard,name='churn_dashboard'),
    path('api/reports/', ReportAPIView.as_view(), name='reports'),
    path('api/reports/<int:report_id>/', ReportDetailAPIView.as_view(), name='report-detail'),
    path('api/reports/search/', ReportSearchAPIView.as_view(), name='report-search'),

    path('api/connect_database/', connect_database, name='connect_database'),
    path('api/ask_question/', ask_question, name='ask_question'),
    path('api/check_intent/', check_intent, name='check_intent'),
    path('api/connect_database/', connect_database, name='connect_database'),
    path('api/ask_qwen/', ask_qwen, name='ask_qwen'),
    path('api/download-template/<str:filename>/', views.download_template, name='download_template'),
    path('api/download-full-data', DownloadFullDataForSegment.as_view(), name='download-full-data'),
    path('api/download-reason-data', download_reason_data, name = 'download-reason-data'),
    path("api/churn/segments", ChurnSegments.as_view()),
    path("api/churn/policies", ChurnPolicies.as_view()),
    path("api/churn/probability", ChurnProbability.as_view()),
    path("api/churn/policy", ChurnPolicyDetail.as_view()),
    path("api/churn/param-ranges", ChurnParamRanges.as_view()),
    path("api/churn/simulate-manual", ChurnSimulateManual.as_view()),
    path("api/churn/auto-suggest",    ChurnAutoSuggest.as_view()),
    path("api/churn/save-selected",   ChurnSaveSelected.as_view()),
    path("api/churn/latest-selected", ChurnLatestSelected.as_view()),
    path("api/churn/draft-email",     ChurnDraftEmail.as_view()),
    path("api/churn/send-email", ChurnSendEmail.as_view()),
    path("api/ask_question_stream/", ask_question_stream),
    path("api/drillthrough/", DrillthroughView.as_view(), name="drillthrough"),
    path('api/save_to_corpus/', save_to_corpus_endpoint, name='save_to_corpus'),
    path("api/search_corpus/", search_corpus, name="search_corpus"),
    path("api/entries/", list_corpus_entries),
    path("api/gmail/auth_url", views.gmail_auth_url, name="gmail_auth_url"),
    path("api/gmail/callback", views.gmail_oauth_callback, name="gmail_callback"),  # <-- name exists
    path("api/gmail/status", views.gmail_status, name="gmail_status"),
    path("api/gmail/revoke", views.gmail_revoke, name="gmail_revoke"),
    # path('api/pipeline-status', PipelineStatusView.as_view(), name='pipeline-status')
    path("api/backend-status/", backend_status, name="backend_status"),


]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
