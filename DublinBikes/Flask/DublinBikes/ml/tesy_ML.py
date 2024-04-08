import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('TkAgg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
import warnings

warnings.filterwarnings('ignore')

# Read the dataset
bike_df = pd.read_csv("./input/day.csv")

# Rename columns
bike_df.rename(columns={'instant': 'rec_id', 'dteday': 'datetime', 'yr': 'year', 'mnth': 'month',
                        'weathersit': 'weather_condition',
                        'hum': 'humidity', 'cnt': 'total_count'}, inplace=True)

# Convert 'datetime' column to datetime format
bike_df['datetime'] = pd.to_datetime(bike_df['datetime'])

# Convert categorical columns to category type
cat_cols = ['season', 'year', 'month', 'holiday', 'weekday', 'workingday', 'weather_condition']
bike_df[cat_cols] = bike_df[cat_cols].astype('category')

# Check for missing values
bike_df.isnull().sum()



from fancyimpute import KNN

# create dataframe for outliers
wind_hum = pd.DataFrame(bike_df, columns=['windspeed', 'humidity'])
# Cnames for outliers
cnames = ['windspeed', 'humidity']

for i in cnames:
    q75, q25 = np.percentile(wind_hum.loc[:, i], [75, 25])  # Divide data into 75%quantile and 25%quantile.
    iqr = q75 - q25  # Inter quantile range
    min = q25 - (iqr * 1.5)  # inner fence
    max = q75 + (iqr * 1.5)  # outer fence
    wind_hum.loc[wind_hum.loc[:, i] < min, :i] = np.nan  # Replace with NA
    wind_hum.loc[wind_hum.loc[:, i] > max, :i] = np.nan  # Replace with NA
# Imputating the outliers by mean Imputation
wind_hum['windspeed'] = wind_hum['windspeed'].fillna(wind_hum['windspeed'].mean())
wind_hum['humidity'] = wind_hum['humidity'].fillna(wind_hum['humidity'].mean())
# Replacing the imputated windspeed
bike_df['windspeed'] = bike_df['windspeed'].replace(wind_hum['windspeed'])
# Replacing the imputated humidity
bike_df['humidity'] = bike_df['humidity'].replace(wind_hum['humidity'])
bike_df.head(5)
import scipy
from scipy import stats
#Normal plot

# plt.show()
#Create the correlation matrix
correMtr=bike_df[["temp","atemp","humidity","windspeed","casual","registered","total_count"]].corr()
mask=np.array(correMtr)
mask[np.tril_indices_from(mask)]=False
#Heat map for correlation matrix of attributes


#load the required libraries
from sklearn import preprocessing,metrics,linear_model
from sklearn.model_selection import cross_val_score,cross_val_predict,train_test_split

from sklearn.model_selection import train_test_split
X_train,X_test,y_train,y_test=train_test_split(bike_df.iloc[:,0:-3],bike_df.iloc[:,-1],test_size=0.3, random_state=42)

#Reset train index values
X_train.reset_index(inplace=True)
y_train=y_train.reset_index()

# Reset train index values
X_test.reset_index(inplace=True)
y_test=y_test.reset_index()


#Create a new dataset for train attributes
train_attributes=X_train[['season','month','year','weekday','holiday','workingday','weather_condition','humidity','temp','windspeed']]
#Create a new dataset for test attributes
test_attributes=X_test[['season','month','year','weekday','holiday','workingday','humidity','temp','windspeed','weather_condition']]
#categorical attributes
cat_attributes=['season','holiday','workingday','weather_condition','year']
#numerical attributes
num_attributes=['temp','windspeed','humidity','month','weekday']

#To get dummy variables to encode the categorical features to numeric
train_encoded_attributes=pd.get_dummies(train_attributes,columns=cat_attributes)
# print('Shape of transfomed dataframe::',train_encoded_attributes.shape)
train_encoded_attributes.head(5)
X_train=train_encoded_attributes
y_train=y_train.total_count.values
lr_model=linear_model.LinearRegression()
lr_model
lr_model.fit(X_train,y_train)
#Accuracy of the model
lr=lr_model.score(X_train,y_train)

#Cross validation prediction
predict=cross_val_predict(lr_model,X_train,y_train,cv=3)
predict
#Cross validation plot

# plt.show()
r2_scores = cross_val_score(lr_model, X_train, y_train, cv=3)
# print('R-squared scores :',np.average(r2_scores))
#Test dataset for prediction
#To get dummy variables to encode the categorical features to numeric
test_encoded_attributes=pd.get_dummies(test_attributes,columns=cat_attributes)
# print('Shape of transformed dataframe :',test_encoded_attributes.shape)
test_encoded_attributes.head(5)
X_test=test_encoded_attributes
y_test=y_test.total_count.values
#predict the model
lr_pred=lr_model.predict(X_test)
lr_pred
import math
#Root mean square error
rmse=math.sqrt(metrics.mean_squared_error(y_test,lr_pred))
#Mean absolute error
mae=metrics.mean_absolute_error(y_test,lr_pred)

#Residual plot

# plt.show()
#training the model
from sklearn.tree import DecisionTreeRegressor
dtr=DecisionTreeRegressor(min_samples_split=2,max_leaf_nodes=10)
dtr.fit(X_train,y_train)
#Accuracy score of the model
dtr_score=dtr.score(X_train,y_train)
#Plot the learned model
from sklearn import tree
import pydot
import graphviz

# export the learned model to tree
dot_data = tree.export_graphviz(dtr, out_file=None)
graph = graphviz.Source(dot_data)
graph
predict=cross_val_predict(dtr,X_train,y_train,cv=3)
predict
# Cross validation prediction plot

# plt.show()
#R-squared scores
r2_scores = cross_val_score(dtr, X_train, y_train, cv=3)
# print('R-squared scores :',np.average(r2_scores))
#predict the model
dtr_pred=dtr.predict(X_test)
dtr_pred
#Root mean square error
rmse=math.sqrt(metrics.mean_squared_error(y_test,dtr_pred))
#Mean absolute error
mae=metrics.mean_absolute_error(y_test,dtr_pred)

#Residual scatter plot
residuals = y_test-dtr_pred

# plt.show()
##Training the model
from sklearn.ensemble import RandomForestRegressor
X_train=train_encoded_attributes
rf=RandomForestRegressor(n_estimators=200)
rf.fit(X_train,y_train)
rf_score =rf.score(X_train,y_train)
predict=cross_val_predict(rf,X_train,y_train,cv=3)
predict
#Cross validation prediction plot

# plt.show()
r2_scores = cross_val_score(rf, X_train, y_train, cv=3)
X_test=test_encoded_attributes
rf_pred=rf.predict(X_test)
rf_pred
rmse = math.sqrt(metrics.mean_squared_error(y_test,rf_pred))
mae=metrics.mean_absolute_error(y_test,rf_pred)
#Residual scatter plot
fig, ax = plt.subplots(figsize=(15,8))
residuals=y_test-rf_pred
ax.scatter(y_test, residuals)
ax.axhline(lw=2,color='black')
ax.set_xlabel('Observed')
ax.set_ylabel('Residuals')
ax.set_title('Residual plot')
# plt.show()
Bike_df1=pd.DataFrame(y_test,columns=['y_test'])
Bike_df2=pd.DataFrame(rf_pred,columns=['rf_pred'])
Bike_predictions=pd.merge(Bike_df1,Bike_df2,left_index=True,right_index=True)
Bike_predictions.to_csv('Bike_Renting_Python.csv')
Bike_predictions
print("hello world !")
